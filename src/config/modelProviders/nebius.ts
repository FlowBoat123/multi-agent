import { ModelProviderCard } from '@/types/llm';

const Nebius: ModelProviderCard = {
    chatModels: [],
    checkModel: 'Qwen/Qwen2.5-Coder-7B',
    description: '',
    id: 'nebius',
    modelsUrl: 'https://studio.nebius.com/',
    name: 'Nebius',
    settings: {
        proxyUrl: {
            placeholder: 'https://api.studio.nebius.com/v1',
        },
        sdkType: 'openai',
        showModelFetcher: true,
    },
    url: 'https://nebius.com/',
};

export default Nebius;
