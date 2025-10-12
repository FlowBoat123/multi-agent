import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.moonshot.cn/docs/intro#模型列表
const Moonshot: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Moonshot V1 8K',
      enabled: true,
      functionCall: true,
      id: 'moonshot-v1-8k',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Moonshot V1 32K',
      enabled: true,
      functionCall: true,
      id: 'moonshot-v1-32k',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Moonshot V1 128K',
      enabled: true,
      functionCall: true,
      id: 'moonshot-v1-128k',
    },
  ],
  checkModel: 'kimi-latest',
  description: '',
  id: 'moonshot',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.moonshot.cn/docs/intro',
  name: 'Moonshot',
  settings: {
    disableBrowserRequest: true, // CORS error
    proxyUrl: {
      placeholder: 'https://api.moonshot.cn/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://www.moonshot.cn',
};

export default Moonshot;
