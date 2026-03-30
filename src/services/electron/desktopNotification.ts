import {
  DesktopNotificationResult,
  ShowDesktopNotificationParams,
  dispatch,
} from '@agent/electron-client-ipc';

export class DesktopNotificationService {
  async showNotification(
    params: ShowDesktopNotificationParams,
  ): Promise<DesktopNotificationResult> {
    return dispatch('showDesktopNotification', params);
  }

  async isMainWindowHidden(): Promise<boolean> {
    return dispatch('isMainWindowHidden');
  }
}

export const desktopNotificationService = new DesktopNotificationService();
