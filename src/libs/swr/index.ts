import useSWR, { SWRHook } from 'swr';

import { isDesktop } from '@/const/version';

// @ts-ignore
export const useClientDataSWR: SWRHook = (key, fetch, config) =>
  useSWR(key, fetch, {
    // default is 2000ms ,it makes the user's quick switch don't work correctly.
    dedupingInterval: 0,
    focusThrottleInterval:
      isDesktop
        ? 1500
        : // web 300s
        5 * 60 * 1000,
    refreshWhenOffline: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...config,
  });

// @ts-ignore
export const useOnlyFetchOnceSWR: SWRHook = (key, fetch, config) =>
  useSWR(key, fetch, {
    refreshWhenOffline: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    ...config,
  });

// @ts-ignore
export const useActionSWR: SWRHook = (key, fetch, config) =>
  useSWR(key, fetch, {
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: false,
    revalidateOnMount: false,
    revalidateOnReconnect: false,
    ...config,
  });

export interface SWRRefreshParams<T, A = (...args: any[]) => any> {
  action: A;
  optimisticData?: (data: T | undefined) => T;
}

export type SWRefreshMethod<T> = <A extends (...args: any[]) => Promise<any>>(
  params?: SWRRefreshParams<T, A>,
) => ReturnType<A>;
