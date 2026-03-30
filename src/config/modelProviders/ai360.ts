import { ModelProviderCard } from '@/types/llm';

// ref: https://ai.360.cn/platform/docs/overview
const Ai360: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8000,
      description:
        '',
      displayName: '360GPT2 o1',
      enabled: true,
      id: '360gpt2-o1',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: '360GPT2 Pro',
      enabled: true,
      id: '360gpt2-pro',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: '360GPT Pro',
      enabled: true,
      functionCall: true,
      id: '360gpt-pro',
    },
    {
      contextWindowTokens: 7000,
      description: '',
      displayName: '360GPT Turbo',
      enabled: true,
      id: '360gpt-turbo',
    },
  ],
  checkModel: '360gpt-turbo',
  description:
    '',
  disableBrowserRequest: true,
  id: 'ai360',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://ai.360.cn/platform/docs/overview',
  name: '360 AI',
  settings: {
    disableBrowserRequest: true,
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://ai.360.com',
};

export default Ai360;
