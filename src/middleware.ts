import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthorized, AUTH_COOKIE, authEnabled } from '@/lib/auth';

// 公开放行路径（登录页本身 + 认证 API + 框架静态资源）
const PUBLIC_PREFIXES = ['/login', '/_next', '/favicon.ico', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 未配置访问口令时跳过登录保护（便于本地开发 / 二开）
  if (!authEnabled()) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const ok = await isAuthorized(req.cookies.get(AUTH_COOKIE)?.value);
  if (ok) return NextResponse.next();

  // API 未认证：401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 页面未认证：重定向登录页
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
