import { DEFAULT_SETTINGS } from '@agent/const';
import { UserSettings } from '@agent/types';
import type { PartialDeep } from 'type-fest';

export interface UserSettingsState {
  defaultSettings: UserSettings;
  settings: PartialDeep<UserSettings>;
  updateSettingsSignal?: AbortController;
}

export const initialSettingsState: UserSettingsState = {
  defaultSettings: DEFAULT_SETTINGS,
  settings: {},
};
