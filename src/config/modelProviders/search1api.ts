import { ModelProviderCard } from '@/types/llm';

const Search1API: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1 70B',
      enabled: true,
      id: 'deepseek-r1-70b-online',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek-r1-online',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'DeepSeek R1 70B Fast',
      enabled: true,
      id: 'deepseek-r1-70b-fast-online',
    },
    {
      contextWindowTokens: 163_840,
      description: '',
      displayName: 'DeepSeek R1 Fast',
      enabled: false,
      id: 'deepseek-r1-fast-online',
    },
  ],
  checkModel: 'deepseek-r1-70b-fast-online',
  description: '',
  id: 'search1api',
  modelList: { showModelFetcher: true },
  name: 'Search1API',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.search1api.com/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://www.search1api.com',
};

export default Search1API;
