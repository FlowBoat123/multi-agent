import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { Compass, FolderClosed, MessageSquare, Palette } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 40,
  size: 24,
  strokeWidth: 2,
};

export interface TopActionProps {
  isPinned?: boolean | null;
  tab?: SidebarTabKey;
}

const TopActions = memo<TopActionProps>(({ tab, isPinned }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const switchBackToChat = useGlobalStore((s) => s.switchBackToChat);
  const { showMarket, enableKnowledgeBase, showAiImage } =
    useServerConfigStore(featureFlagsSelectors);
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  const prefetchRoute = useCallback(
    (href: string) => {
      void router.prefetch(href);
    },
    [router],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const run = () => {
      prefetchRoute('/chat');
      if (enableKnowledgeBase) prefetchRoute('/files');
      if (showAiImage) prefetchRoute('/image');
      if (showMarket) prefetchRoute('/discover');
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(run, { timeout: 1200 });

      return () => {
        (window as any).cancelIdleCallback?.(idleId);
      };
    }

    const timer = window.setTimeout(run, 300);
    return () => window.clearTimeout(timer);
  }, [prefetchRoute, enableKnowledgeBase, showAiImage, showMarket]);

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isFilesActive = tab === SidebarTabKey.Files;
  const isDiscoverActive = tab === SidebarTabKey.Discover;
  const isImageActive = tab === SidebarTabKey.Image;

  return (
    <Flexbox gap={8}>
      <Link
        aria-label={t('tab.chat')}
        href={'/chat'}
        onFocus={() => prefetchRoute('/chat')}
        onMouseEnter={() => prefetchRoute('/chat')}
        onPointerDown={() => prefetchRoute('/chat')}
        onClick={(e) => {
          // If Cmd key is pressed, let the default link behavior happen (open in new tab)
          if (e.metaKey || e.ctrlKey) {
            return;
          }

          // Otherwise, prevent default and switch session within the current tab
          e.preventDefault();
          switchBackToChat(useSessionStore.getState().activeId);
        }}
      >
        <ActionIcon
          active={isChatActive}
          icon={MessageSquare}
          size={ICON_SIZE}
          title={
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
              <span>{t('tab.chat')}</span>
              <Hotkey inverseTheme keys={hotkey} />
            </Flexbox>
          }
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {enableKnowledgeBase && (
        <Link
          aria-label={t('tab.files')}
          href={'/files'}
          onFocus={() => prefetchRoute('/files')}
          onMouseEnter={() => prefetchRoute('/files')}
          onPointerDown={() => prefetchRoute('/files')}
        >
          <ActionIcon
            active={isFilesActive}
            icon={FolderClosed}
            size={ICON_SIZE}
            title={t('tab.files')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {showAiImage && (
        <Link
          aria-label={t('tab.aiImage')}
          href={'/image'}
          onFocus={() => prefetchRoute('/image')}
          onMouseEnter={() => prefetchRoute('/image')}
          onPointerDown={() => prefetchRoute('/image')}
        >
          <ActionIcon
            active={isImageActive}
            icon={Palette}
            size={ICON_SIZE}
            title={t('tab.aiImage')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {showMarket && (
        <Link
          aria-label={t('tab.discover')}
          href={'/discover'}
          onFocus={() => prefetchRoute('/discover')}
          onMouseEnter={() => prefetchRoute('/discover')}
          onPointerDown={() => prefetchRoute('/discover')}
        >
          <ActionIcon
            active={isDiscoverActive}
            icon={Compass}
            size={ICON_SIZE}
            title={t('tab.discover')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default TopActions;
