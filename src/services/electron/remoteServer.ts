import { DataSyncConfig, dispatch } from '@agent/electron-client-ipc';

class RemoteServerService {
  getRemoteServerConfig = async () => {
    return dispatch('getRemoteServerConfig');
  };

  setRemoteServerConfig = async (config: DataSyncConfig) => {
    return dispatch('setRemoteServerConfig', config);
  };

  clearRemoteServerConfig = async () => {
    return dispatch('clearRemoteServerConfig');
  };

  requestAuthorization = async (config: DataSyncConfig) => {
    return dispatch('requestAuthorization', config);
  };
}

export const remoteServerService = new RemoteServerService();
