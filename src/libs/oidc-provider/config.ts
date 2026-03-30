import { ClientMetadata } from 'oidc-provider';
import urlJoin from 'url-join';

import { appEnv } from '@/envs/app';

export const defaultClients: ClientMetadata[] = [
  {
    application_type: 'web',
    client_id: 'lobehub-desktop',
    client_name: 'AI Assistant Desktop',
    grant_types: ['authorization_code', 'refresh_token'],

    logo_uri: 'https://hub-apac-1.lobeobjects.space/lobehub-desktop-icon.png',

    post_logout_redirect_uris: [
      urlJoin(appEnv.APP_URL!, '/oauth/logout'),
      'http://localhost:3210/oauth/logout',
    ],

    redirect_uris: [
      urlJoin(appEnv.APP_URL!, '/oidc/callback/desktop'),
      'http://localhost:3210/oidc/callback/desktop',
    ],

    response_types: ['code'],

    token_endpoint_auth_method: 'none',
  },
];

export const defaultScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
];

export const defaultClaims = {
  email: ['email', 'email_verified'],
  openid: ['sub'],
  profile: ['name', 'picture'],
};
