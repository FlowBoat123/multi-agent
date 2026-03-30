import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.baichuan-ai.com/price
const Baichuan: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 32_768,
      description:
        '',
      displayName: 'Baichuan 4',
      enabled: true,
      functionCall: true,
      id: 'Baichuan4',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 32_768,
      description:
        '',
      displayName: 'Baichuan 4 Turbo',
      enabled: true,
      functionCall: true,
      id: 'Baichuan4-Turbo',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 32_768,
      description:
        '',
      displayName: 'Baichuan 4 Air',
      enabled: true,
      functionCall: true,
      id: 'Baichuan4-Air',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 32_768,
      description:
        '',
      displayName: 'Baichuan 3 Turbo',
      functionCall: true,
      id: 'Baichuan3-Turbo',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 128_000,
      description:
        '具备 128K 超长上下文窗口，',
      displayName: 'Baichuan 3 Turbo 128k',
      id: 'Baichuan3-Turbo-128k',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 32_768,
      description:
        '',
      displayName: 'Baichuan 2 Turbo',
      id: 'Baichuan2-Turbo',
      maxOutput: 8192,
    },
  ],
  checkModel: 'Baichuan3-Turbo',
  description:
    '',
  id: 'baichuan',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.baichuan-ai.com/price',
  name: 'Baichuan',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.baichuan-ai.com/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://platform.baichuan-ai.com',
};

export default Baichuan;
