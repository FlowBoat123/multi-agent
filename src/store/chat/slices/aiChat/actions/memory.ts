import { chainSummaryHistory } from '@agent/prompts';
import { TraceNameMap } from '@agent/types';
import { StateCreator } from 'zustand/vanilla';

import { DEFAULT_SYSTEM_AGENT_ITEM } from '@/const/settings';
import { chatService } from '@/services/chat';
import { topicService } from '@/services/topic';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { ChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';
import { ChatMessage } from '@/types/message';

export interface ChatMemoryAction {
  internal_summaryHistory: (messages: ChatMessage[]) => Promise<void>;
}

export const chatMemory: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatMemoryAction
> = (set, get) => ({
  internal_summaryHistory: async (messages) => {
    const topicId = get().activeTopicId;
    if (messages.length <= 1 || !topicId) return;

    const { model, provider } = systemAgentSelectors.historyCompress(useUserStore.getState());
    const { model: currentModel, provider: currentProvider } = agentSelectors.currentAgentConfig(
      useAgentStore.getState(),
    );
    const shouldFollowCurrentProvider =
      !!currentModel &&
      !!currentProvider &&
      (currentModel.includes('multi-agent') ||
        (model === DEFAULT_SYSTEM_AGENT_ITEM.model &&
          provider === DEFAULT_SYSTEM_AGENT_ITEM.provider &&
          currentProvider !== DEFAULT_SYSTEM_AGENT_ITEM.provider));

    const taskModel = shouldFollowCurrentProvider ? currentModel : model;
    const taskProvider = shouldFollowCurrentProvider ? currentProvider : provider;

    let historySummary = '';
    await chatService.fetchPresetTaskResult({
      onFinish: async (text) => {
        historySummary = text;
      },
      params: { ...chainSummaryHistory(messages), model: taskModel, provider: taskProvider, stream: false },
      trace: {
        sessionId: get().activeId,
        topicId: get().activeTopicId,
        traceName: TraceNameMap.SummaryHistoryMessages,
      },
    });

    await topicService.updateTopic(topicId, {
      historySummary,
      metadata: { model: taskModel, provider: taskProvider },
    });
    await get().refreshTopic();
    await get().refreshMessages();
  },
});
