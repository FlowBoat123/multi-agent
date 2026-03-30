import { ModelProviderCard } from '@/types/llm';

// ref :https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
// ref :https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/models
// ref :https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/models
const Bedrock: ModelProviderCard = {
  chatModels: [
    /*
    // TODO: Not support for now
    {
      description: '',
      displayName: 'Titan Text G1 - Lite',
      id: 'amazon.titan-text-lite-v1',
      tokens: 4000,
    },
    {
      description: '',
      displayName: 'Titan Text G1 - Express',
      id: 'amazon.titan-text-express-v1',
      tokens: 8000,
    },
    {
      description: '',
      displayName: 'Titan Text G1 - Premier',
      id: 'amazon.titan-text-premier-v1:0',
      tokens: 32_000,
    },
*/
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.7 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      maxOutput: 8192,
      releasedAt: '2025-02-24',
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.7 Sonnet Extended thinking',
      enabled: true,
      functionCall: true,
      id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
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
      id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
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
      id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.5 Sonnet v2 (Inference profile)',
      enabled: true,
      functionCall: true,
      id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3.5 Sonnet 0620',
      enabled: true,
      functionCall: true,
      id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Haiku',
      enabled: true,
      functionCall: true,
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Sonnet',
      enabled: true,
      functionCall: true,
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 3 Opus',
      enabled: true,
      functionCall: true,
      id: 'anthropic.claude-3-opus-20240229-v1:0',
      vision: true,
    },
    {
      contextWindowTokens: 200_000,
      description:
        '',
      displayName: 'Claude 2.1',
      id: 'anthropic.claude-v2:1',
    },
    {
      contextWindowTokens: 100_000,
      description:
        '',
      displayName: 'Claude 2.0',
      id: 'anthropic.claude-v2',
    },
    {
      contextWindowTokens: 100_000,
      description:
        '',
      displayName: 'Claude Instant',
      id: 'anthropic.claude-instant-v1',
    },
    {
      contextWindowTokens: 128_000,
      description:
        '',
      displayName: 'Llama 3.1 8B Instruct',
      enabled: true,
      functionCall: true,
      id: 'meta.llama3-1-8b-instruct-v1:0',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Llama 3.1 70B Instruct',
      enabled: true,
      functionCall: true,
      id: 'meta.llama3-1-70b-instruct-v1:0',
    },
    {
      contextWindowTokens: 128_000,
      description: '',
      displayName: 'Llama 3.1 405B Instruct',
      enabled: true,
      functionCall: true,
      id: 'meta.llama3-1-405b-instruct-v1:0',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Llama 3 8B Instruct',
      id: 'meta.llama3-8b-instruct-v1:0',
    },
    {
      contextWindowTokens: 8000,
      description: '',
      displayName: 'Llama 3 70B Instruct',
      id: 'meta.llama3-70b-instruct-v1:0',
    },
    /*
    // TODO: Not support for now
    {
      description: 'A 7B dense Transformer, fast-deployed and easily customisable. Small, yet powerful for a variety of use cases. Supports English and code, and a 32k context window.',
      displayName: 'Mistral 7B Instruct',
      enabled: true,
      id: 'mistral.mistral-7b-instruct-v0:2',
      tokens: 32_000,
    },
    {
      description: 'A 7B sparse Mixture-of-Experts model with stronger capabilities than Mistral 7B. Uses 12B active parameters out of 45B total. Supports multiple languages, code and 32k context window.',
      displayName: 'Mixtral 8X7B Instruct',
      enabled: true,
      id: 'mistral.mixtral-8x7b-instruct-v0:1',
      tokens: 32_000,
    },
    {
      description: 'Mistral Small is perfectly suited for straightforward tasks that can be performed in bulk, such as classification, customer support, or text generation. It provides outstanding performance at a cost-effective price point.',
      displayName: 'Mistral Small',
      functionCall: true,
      id: 'mistral.mistral-small-2402-v1:0',
      tokens: 32_000,
    },
    {
      description: 'Mistral Large 2407 is an advanced Large Language Model (LLM) that supports dozens of languages and is trained on 80+ coding languages. It has best-in-class agentic capabilities with native function calling JSON outputting and reasoning capabilities.',
      displayName: 'Mistral Large 2 (24.07)',
      enabled: true,
      functionCall: true,
      id: 'mistral.mistral-large-2407-v1:0',
      tokens: 128_000,
    },
    {
      description: 'The most advanced Mistral AI Large Language model capable of handling any language task including complex multilingual reasoning, text understanding, transformation, and code generation.',
      displayName: 'Mistral Large',
      enabled: true,
      functionCall: true,
      id: 'mistral.mistral-large-2402-v1:0',
      tokens: 32_000,
    },
*/
    /*
    // TODO: Not support for now
    {
      description: 'Command R+ is a highly performant generative language model optimized for large scale production workloads.',
      displayName: 'Command R+',
      enabled: true,
      functionCall: true,
      id: 'cohere.command-r-plus-v1:0',
      tokens: 128_000,
    },
    {
      description: 'Command R is a generative language model optimized for long-context tasks and large scale production workloads.',
      displayName: 'Command R',
      enabled: true,
      functionCall: true,
      id: 'cohere.command-r-v1:0',
      tokens: 128_000,
    },
*/
    /*
    // Cohere Command (Text) and AI21 Labs Jurassic-2 (Text) don't support chat with the Converse API
    {
      description: 'Command is Cohere flagship text generation model. It is trained to follow user commands and to be instantly useful in practical business applications.',
      displayName: 'Command',
      id: 'cohere.command-text-v14',
      tokens: 4000,
    },
    {
      description: 'Cohere Command-Light is a generative model that responds well with instruction-like prompts. This model provides customers with an unbeatable balance of quality, cost-effectiveness, and low-latency inference.',
      displayName: 'Command Light',
      id: 'cohere.command-light-text-v14',
      tokens: 4000,
    },
*/
    /*
    // TODO: Not support for now
    {
      description: 'The latest Foundation Model from AI21 Labs, Jamba-Instruct offers an impressive 256K context window and delivers the best value per price on core text generation, summarization, and question answering tasks for the enterprise.',
      displayName: 'Jamba-Instruct',
      id: 'ai21.jamba-instruct-v1:0',
      tokens: 256_000,
    },
*/
    /*
    // Cohere Command (Text) and AI21 Labs Jurassic-2 (Text) don't support chat with the Converse API
    {
      description: 'Jurassic-2 Mid is less powerful than Ultra, yet carefully designed to strike the right balance between exceptional quality and affordability. Jurassic-2 Mid can be applied to any language comprehension or generation task including question answering, summarization, long-form copy generation, advanced information extraction and many others.',
      displayName: 'Jurassic-2 Mid',
      id: 'ai21.j2-mid-v1',
      tokens: 8191,
    },
    {
      description: 'Jurassic-2 Ultra is AI21’s most powerful model for complex tasks that require advanced text generation and comprehension. Popular use cases include question answering, summarization, long-form copy generation, advanced information extraction, and more.',
      displayName: 'Jurassic-2 Ultra',
      id: 'ai21.j2-ultra-v1',
      tokens: 8191,
    },
*/
  ],
  checkModel: 'anthropic.claude-instant-v1',
  description: '',
  id: 'bedrock',
  modelsUrl: 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html',
  name: 'Bedrock',
  settings: { sdkType: 'bedrock' },
  url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html',
};

export default Bedrock;
