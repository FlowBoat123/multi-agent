import { LobeChatDatabase } from '@agent/database';
import { TRPCError } from '@trpc/server';

import { serverDBEnv } from '@/config/db';
import { FileModel } from '@/database/models/file';
import { FileItem } from '@/database/schemas';
import { TempFileManager } from '@/server/utils/tempFileManager';
import { nanoid } from '@/utils/uuid';

import { FileServiceImpl, createFileServiceModule } from './impls';

export class FileService {
  private userId: string;
  private fileModel: FileModel;

  private impl: FileServiceImpl = createFileServiceModule();

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.fileModel = new FileModel(db, userId);
  }

  public async deleteFile(key: string) {
    return this.impl.deleteFile(key);
  }

  public async deleteFiles(keys: string[]) {
    return this.impl.deleteFiles(keys);
  }

  public async getFileContent(key: string): Promise<string> {
    return this.impl.getFileContent(key);
  }

  public async getFileByteArray(key: string): Promise<Uint8Array> {
    return this.impl.getFileByteArray(key);
  }

  public async createPreSignedUrl(key: string): Promise<string> {
    return this.impl.createPreSignedUrl(key);
  }

  public async createPreSignedUrlForPreview(key: string, expiresIn?: number): Promise<string> {
    return this.impl.createPreSignedUrlForPreview(key, expiresIn);
  }

  public async uploadContent(path: string, content: string) {
    return this.impl.uploadContent(path, content);
  }

  public async getFullFileUrl(url?: string | null, expiresIn?: number): Promise<string> {
    return this.impl.getFullFileUrl(url, expiresIn);
  }

  public getKeyFromFullUrl(url: string): string {
    return this.impl.getKeyFromFullUrl(url);
  }

  public async uploadMedia(key: string, buffer: Buffer): Promise<{ key: string }> {
    return this.impl.uploadMedia(key, buffer);
  }

  async downloadFileToLocal(
    fileId: string,
  ): Promise<{ cleanup: () => void; file: FileItem; filePath: string }> {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'File not found' });
    }

    let content: Uint8Array | undefined;
    try {
      content = await this.getFileByteArray(file.url);
    } catch (e) {
      console.error(e);
      // if file not found, delete it from db
      if ((e as any).Code === 'NoSuchKey') {
        await this.fileModel.delete(fileId, serverDBEnv.REMOVE_GLOBAL_FILE);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'File not found' });
      }
    }

    if (!content) throw new TRPCError({ code: 'BAD_REQUEST', message: 'File content is empty' });

    const dir = nanoid();
    const tempManager = new TempFileManager(dir);

    const filePath = await tempManager.writeTempFile(content, file.name);
    return { cleanup: () => tempManager.cleanup(), file, filePath };
  }
}
