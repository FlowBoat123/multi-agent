import { FluentEmoji } from '@lobehub/ui';
import { t } from 'i18next';

import { notification } from '@/components/AntdStaticMethods';
import { enableAuth } from '@/const/auth';

import RedirectLogin from './RedirectLogin';

export const loginRequired = {
  redirect: ({ timeout = 2000 }: { timeout?: number } = {}) => {
    if (!enableAuth) return;

    // Keep notification alive slightly longer than redirect timer to avoid unmount race.
    const durationInSeconds = Math.max((timeout + 1000) / 1000, 3);

    notification.error({
      description: <RedirectLogin timeout={timeout} />,
      duration: durationInSeconds,
      icon: <FluentEmoji emoji={'🫡'} size={24} />,
      message: t('loginRequired.title', { ns: 'error' }),
      showProgress: true,
      type: 'warning',
    });
  },
};
