
export interface FileServiceImpl {
  createPreSignedUrl(key: string): Promise<string>;

  createPreSignedUrlForPreview(key: string, expiresIn?: number): Promise<string>;

  deleteFile(key: string): Promise<any>;

  deleteFiles(keys: string[]): Promise<any>;

  getFileByteArray(key: string): Promise<Uint8Array>;

  getFileContent(key: string): Promise<string>;

  getFullFileUrl(url?: string | null, expiresIn?: number): Promise<string>;

  getKeyFromFullUrl(url: string): string;

  uploadContent(path: string, content: string): Promise<any>;

  uploadMedia(key: string, buffer: Buffer): Promise<{ key: string }>;
}
