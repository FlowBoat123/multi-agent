import { dispatch } from '@agent/electron-client-ipc';

import { FileMetadata } from '@/types/files';

class DesktopFileAPI {
  async uploadFile(
    file: File,
    hash: string,
    path: string,
  ): Promise<{ metadata: FileMetadata; success: boolean }> {
    const arrayBuffer = await file.arrayBuffer();

    return dispatch('createFile', {
      content: arrayBuffer,
      filename: file.name,
      hash,
      path,
      type: file.type,
    });
  }
}

export const desktopFileAPI = new DesktopFileAPI();
