import { ModelProviderCard } from '@/types/llm';

// ref: https://www.xfyun.cn/doc/spark/HTTP%E8%B0%83%E7%94%A8%E6%96%87%E6%A1%A3.html#_3-%E8%AF%B7%E6%B1%82%E8%AF%B4%E6%98%8E
// ref: https://www.xfyun.cn/doc/spark/Web.html#_1-%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E
const Spark: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Spark Lite',
      enabled: true,
      id: 'lite',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Spark Pro',
      enabled: true,
      id: 'generalv3',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Spark Pro 128K',
      enabled: true,
      id: 'pro-128k',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Spark Max',
      enabled: true,
      functionCall: true,
      id: 'generalv3.5',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Spark Max 32K',
      enabled: true,
      functionCall: true,
      id: 'max-32k',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Spark 4.0 Ultra',
      enabled: true,
      functionCall: true,
      id: '4.0Ultra',
      maxOutput: 8192,
    },
  ],
  checkModel: 'lite',
  description: '',
  id: 'spark',
  modelsUrl: 'https://xinghuo.xfyun.cn/spark',
  name: 'Spark',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://spark-api-open.xf-yun.com/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showModelFetcher: false,
  },
  url: 'https://www.xfyun.cn',
};

export default Spark;
