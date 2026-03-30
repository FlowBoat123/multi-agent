import { contextCachingModels, thinkingWithToolClaudeModels } from '@/const/models';
import { DEFAULT_AGENT_CHAT_CONFIG, DEFAULT_AGENT_SEARCH_FC_MODEL } from '@/const/settings';
import { AgentStoreState } from '@/store/agent/initialState';
import { LobeAgentChatConfig } from '@/types/agent';

import { currentAgentConfig } from './agent';

export const currentAgentChatConfig = (s: AgentStoreState): LobeAgentChatConfig =>
  currentAgentConfig(s).chatConfig || {};

const agentSearchMode = (s: AgentStoreState) => currentAgentChatConfig(s).searchMode || 'off';
const isAgentEnableSearch = (s: AgentStoreState) => agentSearchMode(s) !== 'off';

const useModelBuiltinSearch = (s: AgentStoreState) =>
  currentAgentChatConfig(s).useModelBuiltinSearch;

const searchFCModel = (s: AgentStoreState) => {
  const config = currentAgentChatConfig(s).searchFCModel;
  const current = currentAgentConfig(s);

  // If unset, follow the current conversation model/provider to avoid hidden provider switches.
  if (!config) {
    return { model: current.model, provider: current.provider };
  }

  // If the config still equals the legacy default (OpenAI), but current chat is using
  // another provider (e.g. Ollama), follow current provider to prevent InvalidProviderAPIKey.
  if (
    config.model === DEFAULT_AGENT_SEARCH_FC_MODEL.model &&
    config.provider === DEFAULT_AGENT_SEARCH_FC_MODEL.provider &&
    current.provider !== DEFAULT_AGENT_SEARCH_FC_MODEL.provider
  ) {
    return { model: current.model, provider: current.provider };
  }

  return config;
};

const enableHistoryCount = (s: AgentStoreState) => {
  const config = currentAgentConfig(s);
  const chatConfig = currentAgentChatConfig(s);

  const enableContextCaching = !chatConfig.disableContextCaching;

  if (enableContextCaching && contextCachingModels.has(config.model)) return false;

  const enableSearch = isAgentEnableSearch(s);

  if (enableSearch && thinkingWithToolClaudeModels.has(config.model)) return false;

  return chatConfig.enableHistoryCount;
};

const historyCount = (s: AgentStoreState): number => {
  const chatConfig = currentAgentChatConfig(s);

  return chatConfig.historyCount ?? (DEFAULT_AGENT_CHAT_CONFIG.historyCount as number); // historyCount 为 0 即不携带历史消息
};

const displayMode = (s: AgentStoreState) => {
  const chatConfig = currentAgentChatConfig(s);

  return chatConfig.displayMode || 'chat';
};

const enableHistoryDivider =
  (historyLength: number, currentIndex: number) => (s: AgentStoreState) => {
    const config = currentAgentChatConfig(s);

    return (
      enableHistoryCount(s) &&
      historyLength > (config.historyCount ?? 0) &&
      config.historyCount === historyLength - currentIndex
    );
  };

export const agentChatConfigSelectors = {
  agentSearchMode,
  currentChatConfig: currentAgentChatConfig,
  displayMode,
  enableHistoryCount,
  enableHistoryDivider,
  historyCount,
  isAgentEnableSearch,
  searchFCModel,
  useModelBuiltinSearch,
};
