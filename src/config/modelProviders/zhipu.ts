import { ModelProviderCard } from '@/types/llm';

// ref :https://open.bigmodel.cn/dev/howuse/model
// api https://open.bigmodel.cn/dev/api#language
// ref :https://open.bigmodel.cn/modelcenter/square
const ZhiPu: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'GLM-Zero-Preview',
      id: 'glm-zero-preview',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-Flash',
      enabled: true,
      functionCall: true,
      id: 'glm-4-flash',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-FlashX',
      enabled: true,
      functionCall: true,
      id: 'glm-4-flashx',
    },
    {
      contextWindowTokens: 1_024_000,
      description: '',
      displayName: 'GLM-4-Long',
      functionCall: true,
      id: 'glm-4-long',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-Air',
      enabled: true,
      functionCall: true,
      id: 'glm-4-air',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'GLM-4-AirX',
      enabled: true,
      functionCall: true,
      id: 'glm-4-airx',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-AllTools',
      functionCall: true,
      id: 'glm-4-alltools',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-Plus',
      enabled: true,
      functionCall: true,
      id: 'glm-4-plus',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4-0520',
      functionCall: true,
      id: 'glm-4-0520',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'GLM-4',
      functionCall: true,
      id: 'glm-4',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'GLM-4V-Flash',
      enabled: true,
      id: 'glm-4v-flash',
      releasedAt: '2024-12-09',
      vision: true,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'GLM-4V-Plus',
      enabled: true,
      id: 'glm-4v-plus',
      vision: true,
    },
    {
      contextWindowTokens: 2048,
      description: '',
      displayName: 'GLM-4V',
      id: 'glm-4v',
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'CodeGeeX-4',
      id: 'codegeex-4',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'CharGLM-3',
      id: 'charglm-3',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Emohaa',
      id: 'emohaa',
    },
  ],
  checkModel: 'glm-4-flash-250414',
  description: '',
  id: 'zhipu',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://open.bigmodel.cn/dev/howuse/model',
  name: 'ZhiPu',
  settings: {
    proxyUrl: {
      placeholder: 'https://open.bigmodel.cn/api/paas/v4',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://zhipuai.cn',
};

export default ZhiPu;
