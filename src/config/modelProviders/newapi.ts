import { ModelProviderCard } from '@/types/llm';

const NewAPI: ModelProviderCard = {
  chatModels: [],
  checkModel: 'gpt-4o-mini',
  description: '',
  enabled: true,
  id: 'newapi',
  name: 'New API',
  settings: {
    proxyUrl: {
      placeholder: 'https://your.new-api-provider.com',
    },
    sdkType: 'router',
    showModelFetcher: true,
  },
  url: 'https://github.com/Calcium-Ion/new-api',
};

export default NewAPI;
