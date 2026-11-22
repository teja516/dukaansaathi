import { json, readBody, authed } from '@/lib/http';
import { z } from 'zod';
import { changeUserPassword } from '@/modules/identity';
import { clearSessionCookie } from '@/lib/authContext';

export const POST = authed(async (req, session) => {
  const body = await readBody(req, z.object({ current_password: z.string(), new_password: z.string() }));
  await changeUserPassword(session.userId, body);
  // All sessions are signed out; the client signs in again.
  return json({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
});
