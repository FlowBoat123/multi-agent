import { ModelProviderCard } from '@/types/llm';

// https://cloud.infini-ai.com/genstudio/model
// All models are currently free
const InfiniAI: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek-r1',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek V3',
      enabled: true,
      id: 'deepseek-v3',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'QwQ',
      enabled: true,
      id: 'qwq-32b',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'DeepSeek R1 Distill Qwen 32B',
      enabled: true,
      id: 'deepseek-r1-distill-qwen-32b',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen2.5 72B Instruct',
      enabled: true,
      id: 'qwen2.5-72b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen2.5 32B Instruct',
      enabled: true,
      id: 'qwen2.5-32b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen2.5 Coder 32B Instruct',
      enabled: true,
      id: 'qwen2.5-coder-32b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen2.5 14B Instruct',
      enabled: true,
      id: 'qwen2.5-14b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen2.5 7B Instruct',
      enabled: true,
      id: 'qwen2.5-7b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen 2 72B Instruct',
      enabled: true,
      id: 'qwen2-72b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen 2 7B Instruct',
      enabled: true,
      id: 'qwen2-7b-instruct',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'Yi-1.5 34B Chat',
      enabled: true,
      id: 'yi-1.5-34b-chat',
    },
  ],
  checkModel: 'qwen2.5-7b-instruct',
  description: '',
  id: 'infiniai',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://cloud.infini-ai.com/genstudio/model',
  name: 'InfiniAI',
  settings: {
    proxyUrl: {
      placeholder: 'https://cloud.infini-ai.com/maas/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://cloud.infini-ai.com/genstudio',
};

export default InfiniAI;
