import { ModelProviderCard } from '@/types/llm';

// ref: https://learn.microsoft.com/azure/ai-services/openai/concepts/models
const Azure: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 16_385,
      deploymentName: 'gpt-35-turbo',
      description:
        '',
      displayName: 'GPT 3.5 Turbo',
      enabled: true,
      functionCall: true,
      id: 'gpt-35-turbo',
      maxOutput: 4096,
    },
    {
      contextWindowTokens: 16_384,
      deploymentName: 'gpt-35-turbo-16k',
      description: '',
      displayName: 'GPT 3.5 Turbo',
      functionCall: true,
      id: 'gpt-35-turbo-16k',
    },
    {
      contextWindowTokens: 128_000,
      deploymentName: 'gpt-4-turbo',
      description: '',
      displayName: 'GPT 4 Turbo',
      enabled: true,
      functionCall: true,
      id: 'gpt-4',
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      deploymentName: 'gpt-4o-mini',
      description: '',
      displayName: 'GPT 4o Mini',
      enabled: true,
      functionCall: true,
      id: 'gpt-4o-mini',
      vision: true,
    },
    {
      contextWindowTokens: 128_000,
      deploymentName: 'gpt-4o',
      description: '',
      displayName: 'GPT 4o',
      enabled: true,
      functionCall: true,
      id: 'gpt-4o',
      vision: true,
    },
  ],
  defaultShowBrowserRequest: true,
  description:
    '',
  id: 'azure',
  modelsUrl: 'https://learn.microsoft.com/azure/ai-services/openai/concepts/models',
  name: 'Azure OpenAI',
  settings: {
    defaultShowBrowserRequest: true,
    sdkType: 'azure',
    showDeployName: true,
  },
  url: 'https://azure.microsoft.com',
};

export default Azure;
