import { ModelProviderCard } from '@/types/llm';

// ref https://platform.sensenova.cn/pricing
// ref https://platform.sensenova.cn/release?path=/release-202409.md
const SenseNova: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'SenseChat 5.5',
      enabled: true,
      functionCall: true,
      id: 'SenseChat-5',
    },
    /*
    // Not compatible with local mode (Not support Base64 Image)
    {
      description: '',
      displayName: 'SenseChat 5.5 Vision',
      enabled: true,
      id: 'SenseChat-Vision',
      tokens: 16_384,
      vision: true,
    },
*/
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'SenseChat 5.0 Turbo',
      enabled: true,
      id: 'SenseChat-Turbo',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'SenseChat 5.0 Cantonese',
      id: 'SenseChat-5-Cantonese',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'SenseChat 4.0 128K',
      enabled: true,
      id: 'SenseChat-128K',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'SenseChat 4.0 32K',
      enabled: true,
      id: 'SenseChat-32K',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'SenseChat 4.0 4K',
      enabled: true,
      id: 'SenseChat',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'SenseChat Character',
      id: 'SenseChat-Character',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'SenseChat Character Pro',
      id: 'SenseChat-Character-Pro',
    },
  ],
  checkModel: 'SenseChat-Turbo',
  description: '',
  disableBrowserRequest: true,
  id: 'sensenova',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.sensenova.cn/pricing',
  name: 'SenseNova',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.sensenova.cn/compatible-mode/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://platform.sensenova.cn/home',
};

export default SenseNova;
