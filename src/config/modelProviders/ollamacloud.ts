import { ModelProviderCard } from '@/types/llm';

const OllamaCloud: ModelProviderCard = {
    chatModels: [],
    checkModel: 'gpt-oss:20b',
    description: '',
    id: 'ollamacloud',
    modelsUrl: 'https://ollama.com/library',
    name: 'Ollama Cloud',
    settings: {
        sdkType: 'openai',
        showModelFetcher: true,
    },
    url: 'https://ollama.com/cloud',
};

export default OllamaCloud;
