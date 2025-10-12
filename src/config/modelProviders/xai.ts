import { ModelProviderCard } from '@/types/llm';

// ref: https://x.ai/about
const XAI: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Grok Beta',
      enabled: true,
      functionCall: true,
      id: 'grok-beta',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Grok Vision Beta',
      enabled: true,
      functionCall: true,
      id: 'grok-vision-beta',
      vision: true,
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Grok 2 1212',
      enabled: true,
      functionCall: true,
      id: 'grok-2-1212',
      releasedAt: '2024-12-12',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Grok 2 Vision 1212',
      enabled: true,
      functionCall: true,
      id: 'grok-2-vision-1212',
      releasedAt: '2024-12-12',
      vision: true,
    },
  ],
  checkModel: 'grok-2-1212',
  description: '',
  id: 'xai',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://docs.x.ai/docs#models',
  name: 'xAI (Grok)',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.x.ai/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://x.ai/api',
};

export default XAI;
