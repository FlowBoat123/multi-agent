import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.deepseek.com/api-docs/pricing
const DeepSeek: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek V3',
      enabled: true,
      functionCall: true,
      id: 'deepseek-chat',
      releasedAt: '2024-12-26',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek-reasoner',
      releasedAt: '2025-01-20',
    },
  ],
  checkModel: 'deepseek-chat',
  description: '',
  id: 'deepseek',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.deepseek.com/api-docs/zh-cn/quick_start/pricing',
  name: 'DeepSeek',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.deepseek.com',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://deepseek.com',
};

export default DeepSeek;
