import { ModelProviderCard } from '@/types/llm';

// ref: https://novita.ai/model-api/product/llm-api
const Novita: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3.1 8B Instruct',
      enabled: true,
      id: 'meta-llama/llama-3.1-8b-instruct',
    },
    {
      contextWindowTokens: 131_072,
      description: '',
      displayName: 'Llama 3.1 70B Instruct',
      enabled: true,
      id: 'meta-llama/llama-3.1-70b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Llama 3.1 405B Instruct',
      enabled: true,
      id: 'meta-llama/llama-3.1-405b-instruct',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3 8B Instruct',
      id: 'meta-llama/llama-3-8b-instruct',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Llama 3 70B Instruct',
      id: 'meta-llama/llama-3-70b-instruct',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Gemma 2 9B',
      enabled: true,
      id: 'google/gemma-2-9b-it',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mistral Nemo',
      enabled: true,
      id: 'mistralai/mistral-nemo',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mistral 7B Instruct',
      enabled: true,
      id: 'mistralai/mistral-7b-instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'WizardLM 2 7B',
      enabled: true,
      id: 'microsoft/wizardlm 2-7b',
    },
    {
      contextWindowTokens: 65_535,
      description: '',
      displayName: 'WizardLM-2 8x22B',
      enabled: true,
      id: 'microsoft/wizardlm-2-8x22b',
    },
    {
      contextWindowTokens: 16_000,
      description: '',
      displayName: 'Dolphin Mixtral 8x22B',
      id: 'cognitivecomputations/dolphin-mixtral-8x22b',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Hermes 2 Pro Llama 3 8B',
      id: 'nousresearch/hermes-2-pro-llama-3-8b',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Hermes 2 Mixtral 8x7B DPO',
      id: 'Nous-Hermes-2-Mixtral-8x7B-DPO',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'MythoMax l2 13B',
      id: 'gryphe/mythomax-l2-13b',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'OpenChat 7B',
      id: 'openchat/openchat-7b',
    },
  ],
  checkModel: 'meta-llama/llama-3.1-8b-instruct',
  description: '',
  disableBrowserRequest: true,
  id: 'novita',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://novita.ai/model-api/product/llm-api',
  name: 'Novita',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.novita.ai/v3/openai',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://novita.ai',
};

export default Novita;
