import { ModelProviderCard } from '@/types/llm';

// ref https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu
const BaiduWenxin: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 3.5 8K',
      enabled: true,
      functionCall: true,
      id: 'ernie-3.5-8k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 3.5 8K Preview',
      functionCall: true,
      id: 'ernie-3.5-8k-preview',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'ERNIE 3.5 128K',
      enabled: true,
      functionCall: true,
      id: 'ernie-3.5-128k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 4.0 8K',
      enabled: true,
      functionCall: true,
      id: 'ernie-4.0-8k-latest',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 4.0 8K Preview',
      functionCall: true,
      id: 'ernie-4.0-8k-preview',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 4.0 Turbo 8K',
      enabled: true,
      functionCall: true,
      id: 'ernie-4.0-turbo-8k-latest',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'ERNIE 4.0 Turbo 128K',
      enabled: true,
      functionCall: true,
      id: 'ernie-4.0-turbo-128k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE 4.0 Turbo 8K Preview',
      functionCall: true,
      id: 'ernie-4.0-turbo-8k-preview',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE Lite 8K',
      id: 'ernie-lite-8k',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'ERNIE Lite Pro 128K',
      functionCall: true,
      id: 'ernie-lite-pro-128k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE Tiny 8K',
      id: 'ernie-tiny-8k',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'ERNIE Speed 128K',
      id: 'ernie-speed-128k',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'ERNIE Speed Pro 128K',
      id: 'ernie-speed-pro-128k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE Character 8K',
      id: 'ernie-char-8k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE Character Fiction 8K',
      id: 'ernie-char-fiction-8k',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'ERNIE Novel 8K',
      id: 'ernie-novel-8k',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek V3',
      id: 'deepseek-v3',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'DeepSeek R1',
      id: 'deepseek-r1',
    },
  ],
  checkModel: 'ernie-speed-128k',
  description: '',
  id: 'wenxin',
  modelsUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu#%E5%AF%B9%E8%AF%9Dchat',
  name: 'Wenxin',
  settings: {
    proxyUrl: {
      placeholder: 'https://qianfan.baidubce.com/v2',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
  },
  url: 'https://cloud.baidu.com/wenxin.html',
};

export default BaiduWenxin;
