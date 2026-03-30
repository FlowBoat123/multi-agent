import { chainRewriteQuery } from '@agent/prompts';
import { StateCreator } from 'zustand/vanilla';

import { DEFAULT_QUERY_REWRITE_SYSTEM_AGENT_ITEM } from '@/const/settings';
import { chatService } from '@/services/chat';
import { ragService } from '@/services/rag';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { ChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { toggleBooleanList } from '@/store/chat/utils';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';
import { ChatSemanticSearchChunk } from '@/types/chunk';

export interface ChatRAGAction {
  deleteUserMessageRagQuery: (id: string) => Promise<void>;
  /**
   * Retrieve chunks from semantic search
   */
  internal_retrieveChunks: (
    id: string,
    userQuery: string,
    messages: string[],
  ) => Promise<{ chunks: ChatSemanticSearchChunk[]; queryId?: string; rewriteQuery?: string }>;
  /**
   * Rewrite user content to better RAG query
   */
  internal_rewriteQuery: (id: string, content: string, messages: string[]) => Promise<string>;

  /**
   * Check if we should use RAG
   */
  internal_shouldUseRAG: () => boolean;
  internal_toggleMessageRAGLoading: (loading: boolean, id: string) => void;
  rewriteQuery: (id: string) => Promise<void>;
}

const knowledgeIds = () => agentSelectors.currentKnowledgeIds(useAgentStore.getState());
const hasEnabledKnowledge = () => agentSelectors.hasEnabledKnowledge(useAgentStore.getState());

export const chatRag: StateCreator<ChatStore, [['zustand/devtools', never]], [], ChatRAGAction> = (
  set,
  get,
) => ({
  deleteUserMessageRagQuery: async (id) => {
    const message = chatSelectors.getMessageById(id)(get());

    if (!message || !message.ragQueryId) return;

    // optimistic update the message's ragQuery
    get().internal_dispatchMessage({
      id,
      type: 'updateMessage',
      value: { ragQuery: null },
    });

    await ragService.deleteMessageRagQuery(message.ragQueryId);
    await get().refreshMessages();
  },

  internal_retrieveChunks: async (id, userQuery, messages) => {
    get().internal_toggleMessageRAGLoading(true, id);

    const message = chatSelectors.getMessageById(id)(get());

    // 1. get the rewrite query
    let rewriteQuery = message?.ragQuery as string | undefined;

    // if there is no ragQuery and there is a chat history
    // we need to rewrite the user message to get better results
    if (!message?.ragQuery && messages.length > 0) {
      rewriteQuery = await get().internal_rewriteQuery(id, userQuery, messages);
    }

    // 2. retrieve chunks from semantic search
    const files = chatSelectors.currentUserFiles(get()).map((f) => f.id);
    try {
      const { chunks, queryId } = await ragService.semanticSearchForChat({
        fileIds: knowledgeIds().fileIds.concat(files),
        knowledgeIds: knowledgeIds().knowledgeBaseIds,
        messageId: id,
        rewriteQuery: rewriteQuery || userQuery,
        userQuery,
      });

      get().internal_toggleMessageRAGLoading(false, id);

      return { chunks, queryId, rewriteQuery };
    } catch {
      get().internal_toggleMessageRAGLoading(false, id);

      return { chunks: [] };
    }
  },
  internal_rewriteQuery: async (id, content, messages) => {
    let rewriteQuery = content;

    const queryRewriteConfig = systemAgentSelectors.queryRewrite(useUserStore.getState());
    if (!queryRewriteConfig.enabled) return content;

    const { model: currentModel } = agentSelectors.currentAgentConfig(useAgentStore.getState());
    const { provider: currentProvider } = agentSelectors.currentAgentConfig(useAgentStore.getState());
    const isCurrentModelMultiAgent = currentModel?.includes('multi-agent');

    // Skip hidden rewrite task for multi-agent models to avoid fallback to default OpenAI preset model.
    if (isCurrentModelMultiAgent) return content;

    const shouldFollowCurrentProvider =
      !!currentModel &&
      !!currentProvider &&
      queryRewriteConfig.model === DEFAULT_QUERY_REWRITE_SYSTEM_AGENT_ITEM.model &&
      queryRewriteConfig.provider === DEFAULT_QUERY_REWRITE_SYSTEM_AGENT_ITEM.provider &&
      currentProvider !== DEFAULT_QUERY_REWRITE_SYSTEM_AGENT_ITEM.provider;

    const rewriteQueryParams = {
      model: shouldFollowCurrentProvider ? currentModel : queryRewriteConfig.model,
      provider: shouldFollowCurrentProvider ? currentProvider : queryRewriteConfig.provider,
      ...chainRewriteQuery(
        content,
        messages,
        !!queryRewriteConfig.customPrompt ? queryRewriteConfig.customPrompt : undefined,
      ),
    };

    let ragQuery = '';
    await chatService.fetchPresetTaskResult({
      onFinish: async (text) => {
        rewriteQuery = text;
      },

      onMessageHandle: (chunk) => {
        if (chunk.type !== 'text') return;
        ragQuery += chunk.text;

        get().internal_dispatchMessage({
          id,
          type: 'updateMessage',
          value: { ragQuery },
        });
      },
      params: rewriteQueryParams,
    });

    return rewriteQuery;
  },
  internal_shouldUseRAG: () => {
    //  if there is enabled knowledge, try with ragQuery
    return hasEnabledKnowledge();
  },

  internal_toggleMessageRAGLoading: (loading, id) => {
    set(
      {
        messageRAGLoadingIds: toggleBooleanList(get().messageRAGLoadingIds, id, loading),
      },
      false,
      'internal_toggleMessageLoading',
    );
  },

  rewriteQuery: async (id) => {
    const message = chatSelectors.getMessageById(id)(get());
    if (!message) return;

    // delete the current ragQuery
    await get().deleteUserMessageRagQuery(id);

    const chats = chatSelectors.mainAIChatsWithHistoryConfig(get());

    await get().internal_rewriteQuery(
      id,
      message.content,
      chats.map((m) => m.content),
    );
  },
});
