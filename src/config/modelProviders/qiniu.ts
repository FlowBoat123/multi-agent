import { ModelProviderCard } from '@/types/llm';

// ref: https://developer.qiniu.com/aitokenapi
const Qiniu: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'DeepSeek V3',
      enabled: true,
      id: 'deepseek-v3',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek-r1',
    },
  ],
  checkModel: 'deepseek-r1',
  description: '',
  id: 'qiniu',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://developer.qiniu.com/aitokenapi/12882/ai-inference-api',
  name: 'Qiniu',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.qnaigc.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://www.qiniu.com',
};

export default Qiniu;
