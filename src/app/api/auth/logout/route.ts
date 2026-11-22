import { json, authed } from '@/lib/http';
import { logoutUser } from '@/modules/identity';
import { clearSessionCookie } from '@/lib/authContext';

export const POST = authed(async (_req, session) => {
  await logoutUser(session.userId);
  return json({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
});
