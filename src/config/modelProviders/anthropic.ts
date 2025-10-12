import { ModelProviderCard } from '@/types/llm';

// ref: https://docs.anthropic.com/en/docs/about-claude/models#model-names
const Anthropic: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 4 Opus',
      enabled: true,
      functionCall: true,
      id: 'claude-opus-4-20250514',
      maxOutput: 32_000,
      releasedAt: '2025-05-14',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 4 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'claude-sonnet-4-20250514',
      maxOutput: 64_000,
      releasedAt: '2025-05-14',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.7 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'claude-3-7-sonnet-20250219',
      maxOutput: 64_000,
      releasedAt: '2025-02-24',
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.5 Haiku',
      enabled: true,
      functionCall: true,
      id: 'claude-3-5-haiku-20241022',
      maxOutput: 8192,
      releasedAt: '2024-11-05',
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.5 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'claude-3-5-sonnet-20241022',
      maxOutput: 8192,
      releasedAt: '2024-10-22',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.5 Sonnet 0620',
      functionCall: true,
      id: 'claude-3-5-sonnet-20240620',
      maxOutput: 8192,
      releasedAt: '2024-06-20',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Haiku',
      functionCall: true,
      id: 'claude-3-haiku-20240307',
      maxOutput: 4096,
      releasedAt: '2024-03-07',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Sonnet',
      functionCall: true,
      id: 'claude-3-sonnet-20240229',
      maxOutput: 4096,
      releasedAt: '2024-02-29',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Opus',
      enabled: true,
      functionCall: true,
      id: 'claude-3-opus-20240229',
      maxOutput: 4096,
      releasedAt: '2024-02-29',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 2.1',
      id: 'claude-2.1',
      maxOutput: 4096,
      releasedAt: '2023-11-21',
    },
    {
      contextWindowTokens: 100_000,
      description:
        '',
      displayName: 'Claude 2.0',
      id: 'claude-2.0',
      maxOutput: 4096,
      releasedAt: '2023-07-11',
    },
  ],
  checkModel: 'claude-3-haiku-20240307',
  description:
    '',
  enabled: true,
  id: 'anthropic',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models#model-names',
  name: 'Anthropic',
  proxyUrl: {
    placeholder: 'https://api.anthropic.com',
  },
  settings: {
    proxyUrl: {
      placeholder: 'https://api.anthropic.com',
    },
    responseAnimation: 'smooth',
    sdkType: 'anthropic',
    showModelFetcher: true,
  },
  url: 'https://anthropic.com',
};

export default Anthropic;
