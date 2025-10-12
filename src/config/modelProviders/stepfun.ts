import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.stepfun.com/docs/llm/text
// 根据文档，阶级星辰大模型的上下文长度，其 k 的含义均为 1000
const Stepfun: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Step 1 Flash',
      enabled: true,
      functionCall: true,
      id: 'step-1-flash',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Step 1 8K',
      enabled: true,
      functionCall: true,
      id: 'step-1-8k',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Step 1 32K',
      enabled: true,
      functionCall: true,
      id: 'step-1-32k',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Step 1 128K',
      enabled: true,
      functionCall: true,
      id: 'step-1-128k',
    },
    {
      contextWindowTokens: 256_000,
      description: '',
      displayName: 'Step 1 256K',
      functionCall: true,
      id: 'step-1-256k',
    },
    {
      contextWindowTokens: 16_000,
      description: '',
      displayName: 'Step 2 16K',
      enabled: true,
      functionCall: true,
      id: 'step-2-16k',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Step 2 Mini',
      enabled: true,
      functionCall: true,
      id: 'step-2-mini',
    },
    {
      contextWindowTokens: 16_000,
      description: '',
      displayName: 'Step 2 16K Exp',
      functionCall: true,
      id: 'step-2-16k-exp',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Step 1V 8K',
      enabled: true,
      functionCall: true,
      id: 'step-1v-8k',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Step 1V 32K',
      functionCall: true,
      id: 'step-1v-32k',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Step 1o Vision 32K',
      enabled: true,
      id: 'step-1o-vision-32k',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Step 1.5V Mini',
      enabled: true,
      id: 'step-1.5v-mini',
      vision: true,
    },
  ],
  checkModel: 'step-2-mini',
  description: '',
  // after test, currently https://api.stepfun.com/v1/chat/completions has the CORS issue
  // So we should close the browser request mode
  disableBrowserRequest: true,
  id: 'stepfun',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.stepfun.com/docs/llm/text',
  name: 'Stepfun',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.stepfun.com/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://stepfun.com',
};

export default Stepfun;
