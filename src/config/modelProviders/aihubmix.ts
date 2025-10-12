import { ModelProviderCard } from '@/types/llm';

const AiHubMix: ModelProviderCard = {
  apiKeyUrl: 'https://lobe.li/9mZhb4T',
  chatModels: [],
  checkModel: 'gpt-4.1-nano',
  description: '',
  id: 'aihubmix',
  modelsUrl: 'https://docs.aihubmix.com/cn/api/Model-List',
  name: 'AiHubMix',
  settings: {
    sdkType: 'router',
    showModelFetcher: true,
  },
  url: 'https://aihubmix.com',
};

export default AiHubMix;
