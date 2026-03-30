import { ModelProviderCard } from '@/types/llm';

// ref: https://docs.mistral.ai/getting-started/models/
// ref: https://docs.mistral.ai/capabilities/function_calling/
const Mistral: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Mistral Nemo',
      enabled: true,
      functionCall: true,
      id: 'open-mistral-nemo',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Mistral Small',
      enabled: true,
      functionCall: true,
      id: 'mistral-small-latest',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Mistral Large',
      enabled: true,
      functionCall: true,
      id: 'mistral-large-latest',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Codestral',
      id: 'codestral-latest',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Pixtral Large',
      enabled: true,
      functionCall: true,
      id: 'pixtral-large-latest',
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Pixtral 12B',
      enabled: true,
      id: 'pixtral-12b-2409',
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Ministral 3B',
      id: 'ministral-3b-latest',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Ministral 8B',
      id: 'ministral-8b-latest',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mistral 7B',
      id: 'open-mistral-7b',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mixtral 8x7B',
      id: 'open-mixtral-8x7b',
    },
    {
      contextWindowTokens: 65_536,
      description: '',
      displayName: 'Mixtral 8x22B',
      functionCall: true,
      id: 'open-mixtral-8x22b',
    },
    {
      contextWindowTokens: 256_000,
      description: '',
      displayName: 'Codestral Mamba',
      id: 'open-codestral-mamba',
    },
  ],
  checkModel: 'ministral-3b-latest',
  description: '',
  id: 'mistral',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://docs.mistral.ai/getting-started/models',
  name: 'Mistral',
  settings: {
    disableBrowserRequest: true, // CORS Error
    proxyUrl: {
      placeholder: 'https://api.mistral.ai',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://mistral.ai',
};

export default Mistral;
