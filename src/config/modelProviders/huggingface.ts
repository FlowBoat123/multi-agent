import { ModelProviderCard } from '@/types/llm';

const HuggingFace: ModelProviderCard = {
  apiKeyUrl: 'https://huggingface.co/settings/tokens',
  chatModels: [
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Mistral 7B Instruct v0.3',
      id: 'mistralai/Mistral-7B-Instruct-v0.3',
    },
    {
      contextWindowTokens: 8192,
      description: '',
      displayName: 'Gemma 2 2B Instruct',
      id: 'google/gemma-2-2b-it',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen 2.5 72B Instruct',
      id: 'Qwen/Qwen2.5-72B-Instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Qwen 2.5 Coder 32B Instruct',
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    },
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'QwQ 32B Preview',
      enabled: true,
      id: 'Qwen/QwQ-32B-Preview',
    },
    {
      contextWindowTokens: 32_768,
      displayName: 'Phi 3.5 mini instruct',
      id: 'microsoft/Phi-3.5-mini-instruct',
    },
    {
      contextWindowTokens: 16_384,
      displayName: 'Hermes 3 Llama 3.1 8B',
      id: 'NousResearch/Hermes-3-Llama-3.1-8B',
    },
    {
      contextWindowTokens: 16_384,
      displayName: 'DeepSeek R1 (Distill Qwen 32B)',
      id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    },
    {
      contextWindowTokens: 128_000,
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'deepseek-ai/DeepSeek-R1',
    },
  ],
  checkModel: 'mistralai/Mistral-7B-Instruct-v0.2',
  description: '',
  disableBrowserRequest: true,
  id: 'huggingface',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://huggingface.co/docs/api-inference/en/supported-models',
  name: 'HuggingFace',
  settings: {
    disableBrowserRequest: true,
    sdkType: 'huggingface',
    showModelFetcher: true,
  },
  url: 'https://huggingface.co',
};

export default HuggingFace;
