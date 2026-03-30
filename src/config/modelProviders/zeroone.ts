import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.lingyiwanwu.com/docs#%E6%A8%A1%E5%9E%8B%E4%B8%8E%E8%AE%A1%E8%B4%B9
const ZeroOne: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Lightning',
      enabled: true,
      id: 'yi-lightning',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Vision V2',
      enabled: true,
      id: 'yi-vision-v2',
      vision: true,
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Spark',
      id: 'yi-spark',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Medium',
      id: 'yi-medium',
    },
    {
      contextWindowTokens: 200_000,
      description: '',
      displayName: 'Yi Medium 200K',
      id: 'yi-medium-200k',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Large Turbo',
      id: 'yi-large-turbo',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Large RAG',
      id: 'yi-large-rag',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Yi Large FC',
      functionCall: true,
      id: 'yi-large-fc',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Yi Large',
      id: 'yi-large',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Vision',
      id: 'yi-vision',
      vision: true,
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Large Preview',
      id: 'yi-large-preview',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'Yi Lightning Lite',
      id: 'yi-lightning-lite',
    },
  ],
  checkModel: 'yi-lightning',
  description: '',
  id: 'zeroone',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.lingyiwanwu.com/docs#模型与计费',
  name: '01.AI',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.lingyiwanwu.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://www.lingyiwanwu.com/',
};

export default ZeroOne;
