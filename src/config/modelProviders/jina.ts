import { ModelProviderCard } from '@/types/llm';

const Jina: ModelProviderCard = {
  chatModels: [],
  checkModel: 'jina-deepsearch-v1',
  description: '',
  id: 'jina',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://jina.ai/models',
  name: 'Jina AI',
  settings: {
    proxyUrl: {
      placeholder: 'https://deepsearch.jina.ai/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://jina.ai',
};

export default Jina;
