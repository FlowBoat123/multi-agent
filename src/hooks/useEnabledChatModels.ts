import isEqual from 'fast-deep-equal';

import { isDeprecatedEdition } from '@/const/version';
import { useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { modelProviderSelectors } from '@/store/user/selectors';
import { EnabledProviderWithModels } from '@/types/aiProvider';

export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const enabledList = useUserStore(modelProviderSelectors.modelProviderListForModelSelect, isEqual);
  const enabledChatModelList = useAiInfraStore((s) => s.enabledChatModelList, isEqual);

  if (isDeprecatedEdition) {
    return enabledList;
  }

  if (!enabledChatModelList) return enabledList;

  // Merge runtime list with local enabled list to avoid missing newly added models during cache lag.
  const merged = new Map<string, EnabledProviderWithModels>();

  for (const provider of enabledChatModelList) {
    merged.set(provider.id, {
      ...provider,
      children: [...provider.children],
    });
  }

  for (const provider of enabledList) {
    const current = merged.get(provider.id);

    if (!current) {
      merged.set(provider.id, {
        ...provider,
        children: [...provider.children],
      });
      continue;
    }

    const childMap = new Map(current.children.map((item) => [item.id, item]));
    for (const item of provider.children) {
      if (!childMap.has(item.id)) childMap.set(item.id, item);
    }

    merged.set(provider.id, {
      ...current,
      children: [...childMap.values()],
    });
  }

  return [...merged.values()];
};
