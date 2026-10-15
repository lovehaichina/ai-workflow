import { NextResponse } from 'next/server';
import { verifyCredentials, makeToken, AUTH_COOKIE, AUTH_MAX_AGE } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user, pass } = body as { user?: string; pass?: string };

  if (!user || !pass || !(await verifyCredentials(user, pass))) {
    return NextResponse.json({ ok: false, error: '账号或口令不正确' }, { status: 401 });
  }

  const token = await makeToken(user, pass);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: AUTH_MAX_AGE,
    path: '/',
  });
  return res;
}
