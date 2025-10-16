import { isDesktop } from '@/const/version';

import { DesktopLocalFileImpl } from './local';
import { S3StaticFileImpl } from './s3';
import { FileServiceImpl } from './type';

export const createFileServiceModule = (): FileServiceImpl => {
  if (isDesktop) {
    return new DesktopLocalFileImpl();
  }

  return new S3StaticFileImpl();
};

export type { FileServiceImpl } from './type';
