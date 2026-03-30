import { getXorPayload } from '@agent/utils/server';
import { TRPCError } from '@trpc/server';

import { enableAuth } from '@/const/auth';
import { DESKTOP_USER_ID } from '@/const/desktop';

import { edgeTrpc } from '../init';

export const jwtPayloadChecker = edgeTrpc.middleware(async (opts) => {
  const { ctx } = opts;

  if (!enableAuth) {
    return opts.next({ ctx: { jwtPayload: { userId: DESKTOP_USER_ID } } });
  }

  if (!ctx.authorizationHeader) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const jwtPayload = getXorPayload(ctx.authorizationHeader);

  return opts.next({ ctx: { jwtPayload } });
});
