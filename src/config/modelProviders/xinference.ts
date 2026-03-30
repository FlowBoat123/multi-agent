import { ModelProviderCard } from '@/types/llm';

const Xinference: ModelProviderCard = {
  chatModels: [],
  description: '',
  id: 'xinference',
  modelsUrl: 'https://inference.readthedocs.io/zh-cn/latest/models/builtin/index.html',
  name: 'Xinference',
  settings: {
    proxyUrl: {
      placeholder: 'http://localhost:9997/v1',
    },
    sdkType: 'openai',
  },
  url: 'https://inference.readthedocs.io/zh-cn/v0.12.3/index.html',
};

export default Xinference;
