import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export class TempFileManager {
  private readonly tempDir: string;
  private filePaths: Set<string> = new Set();

  constructor(dirname: string) {
    this.tempDir = mkdtempSync(join(tmpdir(), dirname));
    this.registerCleanupHook();
  }

  async writeTempFile(data: Uint8Array, name: string): Promise<string> {
    const filePath = join(this.tempDir, name);

    try {
      writeFileSync(filePath, data);
      this.filePaths.add(filePath);
      return filePath;
    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to write temp file: ${(error as Error).message}`);
    }
  }

  cleanup(): void {
    if (existsSync(this.tempDir)) {
      // 递归删除目录及内容
      rmSync(this.tempDir, { force: true, recursive: true });
      this.filePaths.clear();
    }
  }

  private registerCleanupHook(): void {
    process.on('exit', () => this.cleanup());
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception, cleaning temp files:', err);
      this.cleanup();
      process.exit(1);
    });
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => {
        this.cleanup();
        process.exit(0);
      });
    });
  }
}
