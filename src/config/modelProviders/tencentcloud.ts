import { ModelProviderCard } from '@/types/llm';

const TencentCloud: ModelProviderCard = {
  chatModels: [],
  checkModel: 'deepseek-v3',
  description: '',
  id: 'tencentcloud',
  modelsUrl: 'https://cloud.tencent.com/document/api/1772/115963',
  name: 'TencentCloud',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.lkeap.cloud.tencent.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://cloud.tencent.com/document/api/1772/115365',
};

export default TencentCloud;
