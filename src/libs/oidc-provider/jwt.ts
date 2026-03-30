import { TRPCError } from '@trpc/server';
import debug from 'debug';
import { importJWK, jwtVerify } from 'jose';

import { oidcEnv } from '@/envs/oidc';

const log = debug('oidc-jwt');

export const getJWKS = (): object => {
  try {
    const jwksString = oidcEnv.OIDC_JWKS_KEY;

    if (!jwksString) {
      throw new Error(
        'OIDC_JWKS_KEY environment variable is required. Please use scripts/generate-oidc-jwk.mjs to generate JWKS.'
      );
    }

    const jwks = JSON.parse(jwksString);

    if (!jwks.keys || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      throw new Error('Invalid JWKS format: missing or empty keys array');
    }

    const hasRS256Key = jwks.keys.some((key: any) => key.alg === 'RS256' && key.kty === 'RSA');
    if (!hasRS256Key) {
      throw new Error('No RSA key with RS256 algorithm found in JWKS');
    }

    return jwks;
  } catch (error) {
    console.error('Failed to parse JWKS:', error);
    throw new Error(`OIDC_JWKS_KEY parse error: ${(error as Error).message}`);
  }
};

const getVerificationKey = async () => {
  try {
    const jwksString = oidcEnv.OIDC_JWKS_KEY;

    if (!jwksString) {
      throw new Error('OIDC_JWKS_KEY environment variable is not set');
    }

    const jwks = JSON.parse(jwksString);

    if (!jwks.keys || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      throw new Error('Invalid JWKS format: missing or empty keys array');
    }

    const privateRsaKey = jwks.keys.find((key: any) => key.alg === 'RS256' && key.kty === 'RSA');
    if (!privateRsaKey) {
      throw new Error('No RSA key with RS256 algorithm found in JWKS');
    }

    const publicKeyJwk = {
      alg: privateRsaKey.alg,
      e: privateRsaKey.e,
      kid: privateRsaKey.kid,
      kty: privateRsaKey.kty,
      n: privateRsaKey.n,
      use: privateRsaKey.use,
    };

    Object.keys(publicKeyJwk).forEach(
      (key) => (publicKeyJwk as any)[key] === undefined && delete (publicKeyJwk as any)[key],
    );

    return await importJWK(publicKeyJwk, 'RS256');
  } catch (error) {
    log('Failed to get JWKS public key: %O', error);
    throw new Error(`Failed to get JWKS public key: ${(error as Error).message}`);
  }
};

export const validateOIDCJWT = async (token: string) => {
  try {
    log('Start validating OIDC JWT token');

    const publicKey = await getVerificationKey();

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });

    log('JWT validation succeeded, payload: %O', payload);

    const userId = payload.sub;
    const clientId = payload.aud;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Missing user ID (sub) in JWT token',
      });
    }

    return {
      clientId,
      payload,
      tokenData: {
        aud: clientId,
        client_id: clientId,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
        scope: payload.scope,
        sub: userId,
      },
      userId,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    log('JWT validation failed: %O', error);

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `JWT token validation failed: ${(error as Error).message}`,
    });
  }
};
