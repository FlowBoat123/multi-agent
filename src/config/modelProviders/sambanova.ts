import { ModelProviderCard } from '@/types/llm';

const SambaNova: ModelProviderCard = {
  chatModels: [],
  checkModel: 'Meta-Llama-3.2-1B-Instruct',
  description: '',
  disableBrowserRequest: true,
  id: 'sambanova',
  modelsUrl: 'https://cloud.sambanova.ai/plans/pricing',
  name: 'SambaNova',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.sambanova.ai/v1',
    },
    sdkType: 'openai',
  },
  url: 'https://cloud.sambanova.ai',
};

export default SambaNova;
