import { ModelProviderCard } from '@/types/llm';

/**
 * @see https://docs.bfl.ai/
 */
const Bfl: ModelProviderCard = {
  chatModels: [],
  description: '',
  enabled: true,
  id: 'bfl',
  name: 'Black Forest Labs',
  settings: {
    disableBrowserRequest: true,
    showAddNewModel: false,
    showChecker: false,
    showModelFetcher: false,
  },
  url: 'https://bfl.ai/',
};

export default Bfl;
