import {
  NetworkProxySettings,
  ShortcutUpdateResult,
  dispatch,
} from '@agent/electron-client-ipc';

class DesktopSettingsService {
  getProxySettings = async () => {
    return dispatch('getProxySettings');
  };

  setSettings = async (data: Partial<NetworkProxySettings>) => {
    return dispatch('setProxySettings', data);
  };

  getDesktopHotkeys = async () => {
    return dispatch('getShortcutsConfig');
  };

  updateDesktopHotkey = async (id: string, accelerator: string): Promise<ShortcutUpdateResult> => {
    return dispatch('updateShortcutConfig', { accelerator, id });
  };

  testProxyConnection = async (url: string) => {
    return dispatch('testProxyConnection', url);
  };

  testProxyConfig = async (config: NetworkProxySettings, testUrl?: string) => {
    return dispatch('testProxyConfig', { config, testUrl });
  };
}

export const desktopSettingsService = new DesktopSettingsService();
