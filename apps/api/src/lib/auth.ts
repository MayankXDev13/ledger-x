import type { AuthUser, VerifyToken } from "../types/hono";
import { getAuth } from "./better-auth";

/**
 * Bearer verification backed by Better Auth (Google-only). The `bearer()`
 * plugin converts `Authorization: Bearer <session-token>` into a session
 * lookup, so the historical Bearer contract is unchanged.
 */
export const verifyToken: VerifyToken = async (ctx, _token) => {
  // Misconfiguration throws here and propagates as a 500 (logged by
  // onError) instead of masquerading as an invalid token.
  const { auth, connect, release } = getAuth(ctx.env);
  try {
    await connect();
    const result = await auth.api.getSession({
      headers: ctx.req.raw.headers,
    });
    if (!result?.user) return null;
    return {
      id: result.user.id,
      email: result.user.email,
      name: (result.user.name as string | undefined) ?? null,
      image: (result.user.image as string | undefined) ?? null,
    } as AuthUser;
  } catch {
    return null;
  } finally {
    await release();
  }
};
