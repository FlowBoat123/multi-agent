import { ModelProviderCard } from '@/types/llm';

// ref https://console.groq.com/docs/tool-use
const Groq: ModelProviderCard = {
  chatModels: [
    // TODO: During preview launch, Groq is limiting 3.2 models to max_tokens of 8k.
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Llama 3.3 70B',
      enabled: true,
      functionCall: true,
      id: 'llama-3.3-70b-versatile',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3.2 11B Vision (Preview)',
      enabled: true,
      id: 'llama-3.2-11b-vision-preview',
      maxOutput: 8192,
      vision: true,
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3.2 90B Vision (Preview)',
      enabled: true,
      id: 'llama-3.2-90b-vision-preview',
      maxOutput: 8192,
      vision: true,
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Llama 3.1 8B',
      enabled: true,
      functionCall: true,
      id: 'llama-3.1-8b-instant',
      maxOutput: 8192,
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Llama 3.1 70B',
      enabled: true,
      functionCall: true,
      id: 'llama-3.1-70b-versatile',
      maxOutput: 8192,
    },
    /*
    // Offline due to overwhelming demand! Stay tuned for updates.
    {
      displayName: 'Llama 3.1 405B',
      functionCall: true,
      id: 'llama-3.1-405b-reasoning',
      tokens: 8_192,
    },
*/
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3 Groq 8B Tool Use (Preview)',
      functionCall: true,
      id: 'llama3-groq-8b-8192-tool-use-preview',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3 Groq 70B Tool Use (Preview)',
      functionCall: true,
      id: 'llama3-groq-70b-8192-tool-use-preview',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Meta Llama 3 8B',
      functionCall: true,
      id: 'llama3-8b-8192',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Meta Llama 3 70B',
      functionCall: true,
      id: 'llama3-70b-8192',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Gemma 2 9B',
      enabled: true,
      functionCall: true,
      id: 'gemma2-9b-it',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Gemma 7B',
      functionCall: true,
      id: 'gemma-7b-it',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mixtral 8x7B',
      functionCall: true,
      id: 'mixtral-8x7b-32768',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'LLaVA 1.5 7B',
      id: 'llava-v1.5-7b-4096-preview',
      vision: true,
    },
  ],
  checkModel: 'llama-3.1-8b-instant',
  description: '',
  id: 'groq',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://console.groq.com/docs/models',
  name: 'Groq',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.groq.com/openai/v1',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://groq.com',
};

export default Groq;
