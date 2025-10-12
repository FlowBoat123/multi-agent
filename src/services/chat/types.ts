import { TracePayload } from '@agent/types';
import { FetchSSEOptions } from '@/utils/fetch';

export interface FetchOptions extends FetchSSEOptions {
  historySummary?: string;
  isWelcomeQuestion?: boolean;
  signal?: AbortSignal | undefined;
  trace?: TracePayload;
}
