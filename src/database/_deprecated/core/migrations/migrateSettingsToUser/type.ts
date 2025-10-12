import { FewShots, LobeAgentTTSConfig, MetaData, STTServer } from '@agent/types';
import type { ThemeMode } from 'antd-style';
import { LLMParams } from 'model-bank';

interface V4LobeAgentConfig {
  autoCreateTopicThreshold: number;
  compressThreshold?: number;
  displayMode?: 'chat' | 'docs';
  enableAutoCreateTopic: boolean;
  enableCompressThreshold?: boolean;
  enableHistoryCount?: boolean;
  enableMaxTokens?: boolean;

  fewShots?: FewShots;
  historyCount?: number;
  inputTemplate?: string;
  model: string;
  params: LLMParams;
  plugins?: string[];
  provider?: string;
  systemRole: string;
  tts: LobeAgentTTSConfig;
}

interface V4DefaultAgent {
  config: V4LobeAgentConfig;
  meta: MetaData;
}

interface OpenAIConfig {
  OPENAI_API_KEY: string;
  azureApiVersion?: string;
  customModelName?: string;
  endpoint?: string;
  models?: string[];
  useAzure?: boolean;
}

interface V4LLMConfig {
  openAI: OpenAIConfig;
}

interface TTSConfig {
  openAI: {
    sttModel: 'whisper-1';
    ttsModel: 'tts-1' | 'tts-1-hd';
  };
  sttAutoStop: boolean;
  sttServer: STTServer;
}

export interface V4Settings {
  avatar: string;
  defaultAgent: V4DefaultAgent;
  fontSize: number;
  language: string;
  languageModel: V4LLMConfig;
  neutralColor?: string;
  password: string;
  primaryColor?: string;
  themeMode: ThemeMode;
  tts: TTSConfig;
}

export interface V5Settings {
  defaultAgent: V4DefaultAgent;
  fontSize: number;
  language: string;
  languageModel: {
    openai: OpenAIConfig;
  };
  neutralColor?: string;
  password: string;
  primaryColor?: string;
  themeMode: ThemeMode;
  tts: TTSConfig;
}
