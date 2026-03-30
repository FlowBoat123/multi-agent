'use client';

import { ActionIcon } from '@lobehub/ui';
import { AlignJustify } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DESKTOP_HEADER_ICON_SIZE, MOBILE_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useOpenChatSettings } from '@/hooks/useInterceptingRoutes';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

const loadAgentSettings = () => import('./AgentSettings');

const AgentSettings = dynamic(loadAgentSettings, {
  ssr: false,
});

const SettingButton = memo<{ mobile?: boolean }>(({ mobile }) => {
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.OpenChatSettings));
  const { t } = useTranslation('common');
  const openChatSettings = useOpenChatSettings();
  const id = useSessionStore((s) => s.activeId);

  const preloadAgentSettings = useCallback(() => {
    void loadAgentSettings();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Warm up the settings chunk during idle time to avoid first-click delay.
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(preloadAgentSettings, { timeout: 1000 });

      return () => {
        (window as any).cancelIdleCallback?.(idleId);
      };
    }

    const timer = window.setTimeout(preloadAgentSettings, 300);
    return () => window.clearTimeout(timer);
  }, [preloadAgentSettings]);

  return (
    <>
      <ActionIcon
        icon={AlignJustify}
        onFocus={preloadAgentSettings}
        onMouseEnter={preloadAgentSettings}
        onPointerDown={preloadAgentSettings}
        onClick={() => openChatSettings()}
        size={mobile ? MOBILE_HEADER_ICON_SIZE : DESKTOP_HEADER_ICON_SIZE}
        title={t('openChatSettings.title', { ns: 'hotkey' })}
        tooltipProps={{
          hotkey,
          placement: 'bottom',
        }}
      />
      <AgentSettings key={id} />
    </>
  );
});

export default SettingButton;
