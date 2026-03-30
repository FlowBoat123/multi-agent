import { StateCreator } from 'zustand/vanilla';

import { enableAuth, enableClerk, enableNextAuth } from '@/const/auth';

import type { UserStore } from '../../store';

export interface UserAuthAction {
  enableAuth: () => boolean;
  /**
   * universal logout method
   */
  logout: () => Promise<void>;
  /**
   * universal login method
   */
  openLogin: () => Promise<void>;
}

export const createAuthSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  UserAuthAction
> = (set, get) => ({
  enableAuth: () => {
    return enableAuth;
  },
  logout: async () => {
    if (enableClerk) {
      get().clerkSignOut?.({ redirectUrl: location.toString() });

      return;
    }

    if (enableNextAuth) {
      const { signOut } = await import('next-auth/react');
      signOut();
    }
  },
  openLogin: async () => {
    if (!enableAuth) return;

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Prevent login loops when already on auth routes.
      if (path.startsWith('/next-auth/signin') || path.startsWith('/login')) return;
    }

    if (enableClerk) {
      const redirectUrl = location.toString();
      get().clerkSignIn?.({
        fallbackRedirectUrl: redirectUrl,
        signUpForceRedirectUrl: redirectUrl,
        signUpUrl: '/signup',
      });

      return;
    }

    if (enableNextAuth) {
      const { signIn } = await import('next-auth/react');
      // Check if only one provider is available
      const providers = get()?.oAuthSSOProviders;
      if (providers && providers.length === 1) {
        signIn(providers[0]);
        return;
      }
      signIn();
      return;
    }

    // Fallback to avoid silent no-op when auth providers are not configured yet.
    if (typeof window !== 'undefined') {
      window.location.assign('/next-auth/signin');
    }
  },
});
