import { ModelProviderCard } from '@/types/llm';

// ref https://www.volcengine.com/docs/82379/1330310
const Doubao: ModelProviderCard = {
  chatModels: [],
  checkModel: 'doubao-1-5-lite-32k-250115',
  description: '',
  id: 'volcengine',
  modelsUrl: 'https://www.volcengine.com/docs/82379/1330310',
  name: 'Volcengine',
  settings: {
    disableBrowserRequest: true, // CORS error
    proxyUrl: {
      placeholder: 'https://ark.cn-beijing.volces.com/api/v3',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showDeployName: true,
  },
  url: 'https://www.volcengine.com/product/ark',
};

export default Doubao;
