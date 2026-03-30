import isEqual from 'fast-deep-equal';
import type { AiModelForSelect } from 'model-bank';
import { useMemo } from 'react';

import { useAiInfraStore } from '@/store/aiInfra';
import { EnabledProviderWithModels } from '@/types/aiProvider';

export const useEnabledEmbeddingModels = (): EnabledProviderWithModels[] => {
    const [enabledAiProviders, enabledAiModels] = useAiInfraStore(
        (s) => [s.enabledAiProviders || [], s.enabledAiModels || []],
        isEqual,
    );

    return useMemo(
        () =>
            enabledAiProviders
                .map((provider) => ({
                    ...provider,
                    children: enabledAiModels
                        .filter((model) => model.providerId === provider.id && model.type === 'embedding')
                        .map(
                            (model) =>
                                ({
                                    abilities: model.abilities,
                                    contextWindowTokens: model.contextWindowTokens,
                                    displayName: model.displayName,
                                    id: model.id,
                                }) as AiModelForSelect,
                        ),
                    name: provider.name || provider.id,
                }))
                .filter((provider) => provider.children.length > 0),
        [enabledAiProviders, enabledAiModels],
    );
};
