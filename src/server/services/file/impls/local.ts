import { sha256 } from 'js-sha256';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { electronIpcClient } from '@/server/modules/ElectronIPCClient';
import { inferContentTypeFromImageUrl } from '@/utils/url';

import { FileServiceImpl } from './type';
import { extractKeyFromUrlOrReturnOriginal } from './utils';

export class DesktopLocalFileImpl implements FileServiceImpl {
  private async getLocalFileUrl(key: string): Promise<string> {
    try {
      return await electronIpcClient.getFileHTTPURL(key);
    } catch (e) {
      console.error('[DesktopLocalFileImpl] Failed to get file HTTP URL via IPC:', e);
      return '';
    }
  }

  async createPreSignedUrl(key: string): Promise<string> {
    return key;
  }

  async createPreSignedUrlForPreview(key: string): Promise<string> {
    return this.getLocalFileUrl(key);
  }

  async deleteFile(key: string): Promise<any> {
    return await this.deleteFiles([key]);
  }

  async deleteFiles(keys: string[]): Promise<any> {
    try {
      if (!keys || keys.length === 0) return { success: true };

      const invalidKeys = keys.filter((key) => !key.startsWith('desktop://'));
      if (invalidKeys.length > 0) {
        console.error('Invalid desktop file paths:', invalidKeys);
        return {
          errors: invalidKeys.map((key) => ({ message: 'Invalid desktop file path', path: key })),
          success: false,
        };
      }

      return await electronIpcClient.deleteFiles(keys);
    } catch (error) {
      console.error('Failed to delete files:', error);
      return {
        errors: [
          {
            message: `Batch delete failed: ${(error as Error).message}`,
            path: 'batch',
          },
        ],
        success: false,
      };
    }
  }

  async getFileByteArray(key: string): Promise<Uint8Array> {
    try {
      const filePath = await electronIpcClient.getFilePathById(key);

      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return new Uint8Array();
      }

      const buffer = readFileSync(filePath);
      return new Uint8Array(buffer);
    } catch (e) {
      console.error('Failed to get file byte array:', e);
      return new Uint8Array();
    }
  }

  async getFileContent(key: string): Promise<string> {
    try {
      const filePath = await electronIpcClient.getFilePathById(key);

      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return '';
      }

      return readFileSync(filePath, 'utf8');
    } catch (e) {
      console.error('Failed to get file content:', e);
      return '';
    }
  }

  async getFullFileUrl(url?: string | null): Promise<string> {
    if (!url) return '';

    // Handle legacy data compatibility using shared utility
    const key = extractKeyFromUrlOrReturnOriginal(url, this.getKeyFromFullUrl.bind(this));

    return this.getLocalFileUrl(key);
  }

  async uploadContent(filePath: string, content: string): Promise<any> {
    console.warn('uploadContent not implemented for Desktop local file service', filePath, content);
    return;
  }

  getKeyFromFullUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter((segment) => segment !== '');

      pathSegments.shift();

      const filePath = pathSegments.join('/');

      return `desktop://${filePath}`;
    } catch (e) {
      console.error('[DesktopLocalFileImpl] Failed to extract key from URL:', e);
      return '';
    }
  }

  async uploadMedia(key: string, buffer: Buffer): Promise<{ key: string }> {
    try {
      const content = buffer.toString('base64');

      const filename = path.basename(key);

      const hash = sha256(buffer);

      const type = inferContentTypeFromImageUrl(key)!;

      const uploadParams = {
        content,
        filename,
        hash,
        path: key,
        type,
      };

      const result = await electronIpcClient.createFile(uploadParams);

      if (!result.success) {
        throw new Error('Failed to upload file via Electron IPC');
      }

      console.log('[DesktopLocalFileImpl] File uploaded successfully:', result.metadata);
      return { key: result.metadata.path };
    } catch (error) {
      console.error('[DesktopLocalFileImpl] Failed to upload media file:', error);
      throw error;
    }
  }
}
