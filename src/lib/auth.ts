// 访问认证（可选的应用层登录保护）
// 账号口令来自环境变量（systemd / .env 注入）。未配置时自动跳过登录保护。

export const AUTH_USER = process.env.AIWF_ACCESS_USER || '';
export const AUTH_PASS = process.env.AIWF_ACCESS_PASS || '';
export const AUTH_COOKIE = 'loh_auth';
export const AUTH_MAX_AGE = 365 * 24 * 3600; // 一年免登录

export const authEnabled = (): boolean => !!(AUTH_USER && AUTH_PASS);

const enc = new TextEncoder();

async function hmac(data: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function makeToken(user: string, pass: string): Promise<string> {
  return hmac(`${user}|${pass}`, pass);
}

export async function verifyCredentials(user: string, pass: string): Promise<boolean> {
  return authEnabled() && user === AUTH_USER && pass === AUTH_PASS;
}

export async function isAuthorized(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await makeToken(AUTH_USER, AUTH_PASS);
  return token === expected;
}
