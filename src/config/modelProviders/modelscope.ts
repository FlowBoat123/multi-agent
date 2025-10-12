import { ModelProviderCard } from '@/types/llm';

// ref: https://modelscope.cn/docs/model-service/API-Inference/intro
const ModelScope: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'DeepSeek-R1-0528',
      enabled: true,
      functionCall: true,
      id: 'deepseek-ai/DeepSeek-R1-0528',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'DeepSeek-V3',
      enabled: true,
      functionCall: true,
      id: 'deepseek-ai/DeepSeek-V3',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'DeepSeek-R1',
      enabled: true,
      functionCall: true,
      id: 'deepseek-ai/DeepSeek-R1',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Qwen3-235B-A22B',
      enabled: true,
      functionCall: true,
      id: 'Qwen/Qwen3-235B-A22B',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Qwen3-32B',
      enabled: true,
      functionCall: true,
      id: 'Qwen/Qwen3-32B',
    },
  ],
  checkModel: 'Qwen/Qwen3-32B',
  description: '',
  id: 'modelscope',
  modelList: { showModelFetcher: true },
  name: 'ModelScope',
  settings: {
    disableBrowserRequest: true, // CORS Error
    proxyUrl: {
      placeholder: 'https://api-inference.modelscope.cn/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://modelscope.cn',
};

export default ModelScope;
