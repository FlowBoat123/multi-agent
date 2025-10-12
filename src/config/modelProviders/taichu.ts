import { ModelProviderCard } from '@/types/llm';

// ref :https://ai-maas.wair.ac.cn/#/doc
const Taichu: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 32_768,
      description: '',
      displayName: 'Taichu 2.0',
      enabled: true,
      functionCall: true,
      id: 'taichu_llm',
    },
    {
      contextWindowTokens: 4096,
      description: '',
      displayName: 'Taichu 2.0V',
      enabled: true,
      id: 'taichu2_mm',
      vision: true,
    },
  ],
  checkModel: 'taichu_llm',
  description: '',
  id: 'taichu',
  modelsUrl: 'https://ai-maas.wair.ac.cn/#/doc',
  name: 'Taichu',
  settings: {
    proxyUrl: {
      placeholder: 'https://ai-maas.wair.ac.cn/maas/v1',
    },
    sdkType: 'openai',
  },
  url: 'https://ai-maas.wair.ac.cn',
};

export default Taichu;
