import { ModelProviderCard } from '@/types/llm';

// ref https://cloud.tencent.com/document/product/1729/104753
const Hunyuan: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 256_000,
      description: '',
      displayName: 'Hunyuan Lite',
      enabled: true,
      id: 'hunyuan-lite',
      maxOutput: 6000,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Hunyuan Standard',
      enabled: true,
      id: 'hunyuan-standard',
      maxOutput: 2000,
    },
    {
      contextWindowTokens: 256_000,
      description: '',
      displayName: 'Hunyuan Standard 256K',
      enabled: true,
      id: 'hunyuan-standard-256K',
      maxOutput: 6000,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Hunyuan Turbo',
      enabled: true,
      functionCall: true,
      id: 'hunyuan-turbo',
      maxOutput: 4000,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Hunyuan Pro',
      enabled: true,
      functionCall: true,
      id: 'hunyuan-pro',
      maxOutput: 4000,
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Hunyuan Vision',
      enabled: true,
      id: 'hunyuan-vision',
      maxOutput: 4000,
      vision: true,
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Hunyuan Code',
      id: 'hunyuan-code',
      maxOutput: 4000,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Hunyuan FunctionCall',
      functionCall: true,
      id: 'hunyuan-functioncall',
      maxOutput: 4000,
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Hunyuan Role',
      id: 'hunyuan-role',
      maxOutput: 4000,
    },
  ],
  checkModel: 'hunyuan-lite',
  description: '',
  disableBrowserRequest: true,
  id: 'hunyuan',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://cloud.tencent.com/document/product/1729/104753',
  name: 'Hunyuan',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.hunyuan.cloud.tencent.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://hunyuan.tencent.com',
};

export default Hunyuan;
