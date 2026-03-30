import { getXorPayload } from '@agent/utils/server';
import { TRPCError } from '@trpc/server';

import { enableAuth } from '@/const/auth';
import { DESKTOP_USER_ID } from '@/const/desktop';

import { trpc } from '../init';

export const keyVaults = trpc.middleware(async (opts) => {
  const { ctx } = opts;

  if (!enableAuth) {
    return opts.next({ ctx: { jwtPayload: { userId: DESKTOP_USER_ID } } });
  }

  if (!ctx.authorizationHeader) throw new TRPCError({ code: 'UNAUTHORIZED' });

  try {
    const jwtPayload = getXorPayload(ctx.authorizationHeader);

    return opts.next({ ctx: { jwtPayload } });
  } catch (e) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: (e as Error).message });
  }
});
