import { InterceptRouteParams, InterceptRouteResponse } from '../types/route';

export interface WindowsDispatchEvents {
  interceptRoute: (params: InterceptRouteParams) => InterceptRouteResponse;

  /**
   * open the AI Assistant Devtools
   */
  openDevtools: () => void;

  openSettingsWindow: (tab?: string) => void;
}
