import { isDeprecatedEdition } from '@/const/version';
import { createHeaderWithAuth } from '@/services/_auth';
import { aiProviderSelectors, getAiInfraStoreState } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { modelConfigSelectors } from '@/store/user/selectors';
import { ChatModelCard } from '@/types/llm';
import { getMessageError } from '@/utils/fetch';

import { API_ENDPOINTS } from './_url';
import { initializeWithClientStore } from './chat/clientModelRuntime';

const isEnableFetchOnClient = (provider: string) => {
  // TODO: remove this condition in V2.0
  if (isDeprecatedEdition) {
    return modelConfigSelectors.isProviderFetchOnClient(provider)(useUserStore.getState());
  } else {
    return aiProviderSelectors.isProviderFetchOnClient(provider)(getAiInfraStoreState());
  }
};

export interface ModelProgressInfo {
  completed?: number;
  digest?: string;
  model?: string;
  status?: string;
  total?: number;
}

export type ProgressCallback = (progress: ModelProgressInfo) => void;
export type ErrorCallback = (error: { message: string }) => void;

export class ModelsService {
  private _abortController: AbortController | null = null;

  getModels = async (provider: string): Promise<ChatModelCard[] | undefined> => {
    const headers = await createHeaderWithAuth({
      headers: { 'Content-Type': 'application/json' },
      provider,
    });
    try {
      /**
       * Use browser agent runtime
       */
      const enableFetchOnClient = isEnableFetchOnClient(provider);
      if (enableFetchOnClient) {
        const agentRuntime = await initializeWithClientStore(provider);
        return agentRuntime.models();
      }

      const res = await fetch(API_ENDPOINTS.models(provider), { headers });
      if (!res.ok) return;

      return res.json();
    } catch {
      return;
    }
  };

  downloadModel = async (
    { model, provider }: { model: string; provider: string },
    { onProgress }: { onError?: ErrorCallback; onProgress?: ProgressCallback } = {},
  ): Promise<void> => {
    try {
      this._abortController = new AbortController();
      const signal = this._abortController.signal;

      const headers = await createHeaderWithAuth({
        headers: { 'Content-Type': 'application/json' },
        provider,
      });

      const enableFetchOnClient = isEnableFetchOnClient(provider);

      console.log('enableFetchOnClient：', enableFetchOnClient);
      let res: Response;
      if (enableFetchOnClient) {
        const agentRuntime = await initializeWithClientStore(provider);
        res = (await agentRuntime.pullModel({ model }, { signal }))!;
      } else {
        res = await fetch(API_ENDPOINTS.modelPull(provider), {
          body: JSON.stringify({ model }),
          headers,
          method: 'POST',
          signal,
        });
      }

      if (!res.ok) {
        throw await getMessageError(res);
      }

      if (res.body) {
        await this.processModelPullStream(res, { onProgress });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('download model error:', error);
      throw error;
    } finally {
      this._abortController = null;
    }
  };

  abortPull = () => {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  };

  private processModelPullStream = async (
    response: Response,
    { onProgress, onError }: { onError?: ErrorCallback; onProgress?: ProgressCallback },
  ): Promise<void> => {
    const reader = response.body?.getReader();
    if (!reader) return;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const progressText = new TextDecoder().decode(value);
      const progressUpdates = progressText.trim().split('\n');

      for (const update of progressUpdates) {
        let progress;
        try {
          progress = JSON.parse(update);
        } catch (e) {
          console.error('Error parsing progress update:', e);
          console.error('raw data', update);
        }

        if (progress.status === 'canceled') {
          console.log('progress：', progress);
          // const abortError = new Error('abort');
          // abortError.name = 'AbortError';
          //
          // throw abortError;
        }

        if (progress.status === 'error') {
          onError?.({ message: progress.error });
          throw new Error(progress.error);
        }

        if (progress.completed !== undefined || progress.status) {
          onProgress?.(progress);
        }
      }
    }
  };
}

export const modelsService = new ModelsService();
