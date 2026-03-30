import { useTimeout } from 'ahooks';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';

const RedirectLogin = memo<{ timeout: number }>(({ timeout = 2000 }) => {
  const signIn = useUserStore((s) => s.openLogin);
  const { t } = useTranslation('error');
  const isAuthPage =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/next-auth/signin') ||
      window.location.pathname.startsWith('/login'));

  useTimeout(() => {
    if (isAuthPage) return;
    void signIn();
  }, timeout);

  return (
    <div
      onClick={() => {
        if (isAuthPage) return;
        void signIn();
      }}
      style={{ cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
    >
      {t('loginRequired.desc')}
    </div>
  );
});

export default RedirectLogin;
