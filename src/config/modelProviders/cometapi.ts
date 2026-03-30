import { ModelProviderCard } from '@/types/llm';

// ref: https://api.cometapi.com/pricing
const CometAPI: ModelProviderCard = {
  chatModels: [],
  checkModel: 'gpt-5-mini',
  description: '',
  enabled: true,
  id: 'cometapi',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://api.cometapi.com/v1/models',
  name: 'CometAPI',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.cometapi.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://cometapi.com',
};

export default CometAPI;
