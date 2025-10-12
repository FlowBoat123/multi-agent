import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.minimaxi.com/document/Models
const Minimax: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 245_760,
      description: '',
      displayName: 'abab6.5s',
      enabled: true,
      functionCall: true,
      id: 'abab6.5s-chat',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'abab6.5g',
      enabled: true,
      functionCall: true,
      id: 'abab6.5g-chat',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'abab6.5t',
      enabled: true,
      functionCall: true,
      id: 'abab6.5t-chat',
    },
    {
      contextWindowTokens: 16_384,
      description: '',
      displayName: 'abab5.5',
      id: 'abab5.5-chat',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'abab5.5s',
      id: 'abab5.5s-chat',
    },
  ],
  checkModel: 'abab6.5s-chat',
  description: '',
  id: 'minimax',
  modelsUrl: 'https://platform.minimaxi.com/document/Models',
  name: 'Minimax',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.minimax.chat/v1',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'openai',
  },
  url: 'https://www.minimaxi.com',
};

export default Minimax;
