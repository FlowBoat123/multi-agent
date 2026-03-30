import { dev, linux, macOS, windows } from 'electron-is';
import os from 'node:os';

export const isDev = dev();

export const OFFICIAL_CLOUD_SERVER = process.env.OFFICIAL_CLOUD_SERVER || 'https://lobechat.com';

export const isMac = macOS();
export const isWindows = windows();
export const isLinux = linux();

function getIsWindows11() {
  if (!isWindows) return false;
  const release = os.release();
  const parts = release.split('.');

  const majorVersion = parseInt(parts[0], 10);
  const minorVersion = parseInt(parts[1], 10);

  const buildNumber = parseInt(parts[2], 10);

  return majorVersion === 10 && minorVersion === 0 && buildNumber >= 22_000;
}

export const isWindows11 = getIsWindows11();
