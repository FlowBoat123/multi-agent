import { ModelProviderCard } from '@/types/llm';

const InternLM: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'InternLM2.5',
      enabled: true,
      functionCall: true,
      id: 'internlm2.5-latest',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'InternLM2 Pro Chat',
      functionCall: true,
      id: 'internlm2-pro-chat',
      maxOutput: 4096,
    },
  ],
  checkModel: 'internlm2.5-latest',
  description: '',
  disableBrowserRequest: true,
  id: 'internlm',
  modelList: { showModelFetcher: true },
  modelsUrl:
    'https://internlm.intern-ai.org.cn/doc/docs/Models#%E8%8E%B7%E5%8F%96%E6%A8%A1%E5%9E%8B%E5%88%97%E8%A1%A8',
  name: 'InternLM',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://internlm-chat.intern-ai.org.cn/puyu/api/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://internlm.intern-ai.org.cn',
};

export default InternLM;
