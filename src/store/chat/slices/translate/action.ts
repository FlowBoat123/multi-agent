import { chainLangDetect, chainTranslate } from '@agent/prompts';
import { TraceNameMap, TracePayload } from '@agent/types';
import { produce } from 'immer';
import { StateCreator } from 'zustand/vanilla';

import { DEFAULT_SYSTEM_AGENT_ITEM } from '@/const/settings';
import { supportLocales } from '@/locales/resources';
import { chatService } from '@/services/chat';
import { messageService } from '@/services/message';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { chatSelectors } from '@/store/chat/selectors';
import { ChatStore } from '@/store/chat/store';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';
import { ChatTranslate } from '@/types/message';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('enhance');

/**
 * chat translate
 */
export interface ChatTranslateAction {
  clearTranslate: (id: string) => Promise<void>;
  getCurrentTracePayload: (data: Partial<TracePayload>) => TracePayload;
  translateMessage: (id: string, targetLang: string) => Promise<void>;
  updateMessageTranslate: (id: string, data: Partial<ChatTranslate> | false) => Promise<void>;
}

export const chatTranslate: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatTranslateAction
> = (set, get) => ({
  clearTranslate: async (id) => {
    await get().updateMessageTranslate(id, false);
  },
  getCurrentTracePayload: (data) => ({
    sessionId: get().activeId,
    topicId: get().activeTopicId,
    ...data,
  }),

  translateMessage: async (id, targetLang) => {
    const { internal_toggleChatLoading, updateMessageTranslate, internal_dispatchMessage } = get();

    const message = chatSelectors.getMessageById(id)(get());
    if (!message) return;

    // Get current agent for translation
    const translationSetting = systemAgentSelectors.translation(useUserStore.getState());
    const { model: currentModel, provider: currentProvider } = agentSelectors.currentAgentConfig(
      useAgentStore.getState(),
    );
    const shouldFollowCurrentProvider =
      !!currentModel &&
      !!currentProvider &&
      (currentModel.includes('multi-agent') ||
        (translationSetting.model === DEFAULT_SYSTEM_AGENT_ITEM.model &&
          translationSetting.provider === DEFAULT_SYSTEM_AGENT_ITEM.provider &&
          currentProvider !== DEFAULT_SYSTEM_AGENT_ITEM.provider));
    const taskConfig =
      shouldFollowCurrentProvider
        ? { ...translationSetting, model: currentModel, provider: currentProvider }
        : translationSetting;

    // create translate extra
    await updateMessageTranslate(id, { content: '', from: '', to: targetLang });

    internal_toggleChatLoading(true, id, n('translateMessage(start)', { id }));

    let content = '';
    let from = '';

    // detect from language
    chatService.fetchPresetTaskResult({
      onFinish: async (data) => {
        if (data && supportLocales.includes(data)) from = data;

        await updateMessageTranslate(id, { content, from, to: targetLang });
      },
      params: merge(taskConfig, chainLangDetect(message.content)),
      trace: get().getCurrentTracePayload({ traceName: TraceNameMap.LanguageDetect }),
    });

    // translate to target language
    await chatService.fetchPresetTaskResult({
      onFinish: async (content) => {
        await updateMessageTranslate(id, { content, from, to: targetLang });
        internal_toggleChatLoading(false, id);
      },
      onMessageHandle: (chunk) => {
        switch (chunk.type) {
          case 'text': {
            internal_dispatchMessage({
              id,
              key: 'translate',
              type: 'updateMessageExtra',
              value: produce({ content: '', from, to: targetLang }, (draft) => {
                content += chunk.text;
                draft.content += content;
              }),
            });
            break;
          }
        }
      },
      params: merge(taskConfig, chainTranslate(message.content, targetLang)),
      trace: get().getCurrentTracePayload({ traceName: TraceNameMap.Translator }),
    });
  },

  updateMessageTranslate: async (id, data) => {
    await messageService.updateMessageTranslate(id, data);

    await get().refreshMessages();
  },
});
