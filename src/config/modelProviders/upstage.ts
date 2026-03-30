import { ModelProviderCard } from '@/types/llm';

// ref :https://developers.upstage.ai/docs/getting-started/models
const Upstage: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Solar Mini',
      enabled: true,
      functionCall: true,
      id: 'solar-1-mini-chat',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Solar Mini (Ja)',
      functionCall: false,
      id: 'solar-1-mini-chat-ja',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Solar Pro',
      enabled: true,
      functionCall: false,
      id: 'solar-pro',
    },
  ],
  checkModel: 'solar-1-mini-chat',
  description: '',
  id: 'upstage',
  modelsUrl: 'https://developers.upstage.ai/docs/getting-started/models',
  name: 'Upstage',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.upstage.ai/v1/solar',
    },
    sdkType: 'openai',
  },
  url: 'https://upstage.ai',
};

export default Upstage;
