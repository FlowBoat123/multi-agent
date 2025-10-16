import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { FilesStoreState, initialState } from './initialState';
import { FileAction, createFileSlice } from './slices/chat';
import { FileChunkAction, createFileChunkSlice } from './slices/chunk';
import { FileManageAction, createFileManageSlice } from './slices/fileManager';
import { TTSFileAction, createTTSFileSlice } from './slices/tts';
import { FileUploadAction, createFileUploadSlice } from './slices/upload/action';

export type FileStore = FilesStoreState &
  FileAction &
  TTSFileAction &
  FileManageAction &
  FileChunkAction &
  FileUploadAction;

const createStore: StateCreator<FileStore, [['zustand/devtools', never]]> = (...parameters) => ({
  ...initialState,
  ...createFileSlice(...parameters),
  ...createFileManageSlice(...parameters),
  ...createTTSFileSlice(...parameters),
  ...createFileChunkSlice(...parameters),
  ...createFileUploadSlice(...parameters),
});

const devtools = createDevtools('file');

export const useFileStore = createWithEqualityFn<FileStore>()(devtools(createStore), shallow);

export const getFileStoreState = () => useFileStore.getState();
