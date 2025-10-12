import { ModelProviderCard } from '@/types/llm';

const AkashChat: ModelProviderCard = {
  chatModels: [],
  checkModel: 'Meta-Llama-3-1-8B-Instruct-FP8',
  description: '',
  id: 'akashchat',
  modelsUrl: 'https://chatapi.akash.network/documentation',
  name: 'AkashChat',
  settings: {
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://chatapi.akash.network/',
};

export default AkashChat;
