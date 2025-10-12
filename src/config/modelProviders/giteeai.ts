import { ModelProviderCard } from '@/types/llm';

// ref: https://ai.gitee.com/serverless-api/packages/1910
const GiteeAI: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 16_000,
      description: '',
      displayName: 'Qwen2.5 72B Instruct',
      enabled: true,
      functionCall: true,
      id: 'Qwen2.5-72B-Instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Qwen2.5 32B Instruct',
      enabled: true,
      id: 'Qwen2.5-32B-Instruct',
    },
    {
      contextWindowTokens: 24_000,
      description: '',
      displayName: 'Qwen2.5 14B Instruct',
      enabled: true,
      id: 'Qwen2.5-14B-Instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Qwen2.5 7B Instruct',
      enabled: true,
      functionCall: true,
      id: 'Qwen2.5-7B-Instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Qwen2 72B Instruct',
      id: 'Qwen2-72B-Instruct',
    },
    {
      contextWindowTokens: 24_000,
      description: '',
      displayName: 'Qwen2 7B Instruct',
      id: 'Qwen2-7B-Instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Qwen2.5 Coder 32B Instruct',
      enabled: true,
      id: 'Qwen2.5-Coder-32B-Instruct',
    },
    {
      contextWindowTokens: 24_000,
      description:
        'Qwen2.5-Coder-14B-Instruct',
      displayName: 'Qwen2.5 Coder 14B Instruct',
      enabled: true,
      id: 'Qwen2.5-Coder-14B-Instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'Qwen2 VL 72B',
      enabled: true,
      id: 'Qwen2-VL-72B',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'InternVL2.5 26B',
      enabled: true,
      id: 'InternVL2.5-26B',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'InternVL2 8B',
      enabled: true,
      id: 'InternVL2-8B',
      vision: true,
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'GLM4 9B Chat',
      enabled: true,
      id: 'glm-4-9b-chat',
    },
    {
      contextWindowTokens: 4000,
      description: '',
      displayName: 'Yi 34B Chat',
      enabled: true,
      id: 'Yi-34B-Chat',
    },
    /*
    // not compatible with OpenAI SDK
    {
      description: '',
      displayName: 'Code Raccoon v1',
      enabled: true,
      id: 'code-raccoon-v1',
    },
*/
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'DeepSeek Coder 33B Instruct',
      enabled: true,
      id: 'deepseek-coder-33B-instruct',
    },
    {
      contextWindowTokens: 32_000,
      description: '',
      displayName: 'CodeGeeX4 All 9B',
      enabled: true,
      id: 'codegeex4-all-9b',
    },
  ],
  checkModel: 'Qwen2.5-72B-Instruct',
  description: '',
  disableBrowserRequest: true,
  id: 'giteeai',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://ai.gitee.com/docs/openapi/v1#tag/serverless/POST/chat/completions',
  name: 'Gitee AI',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://ai.gitee.com/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://ai.gitee.com',
};

export default GiteeAI;
