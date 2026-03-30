import { ModelProviderCard } from '@/types/llm';

// ref: https://ai.google.dev/gemini-api/docs/models/gemini
const VertexAI: ModelProviderCard = {
  chatModels: [],
  checkModel: 'gemini-1.5-flash-001',
  description: '',
  id: 'vertexai',
  modelsUrl: 'https://console.cloud.google.com/vertex-ai/model-garden',
  name: 'Vertex AI',
  settings: {
    disableBrowserRequest: true,
    responseAnimation: 'smooth',
    showModelFetcher: false,
  },
  url: 'https://cloud.google.com/vertex-ai',
};

export default VertexAI;
