'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      setError('请输入账号和口令');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.href = '/';
        return;
      }
      setError(data.error || '账号或口令不正确');
    } catch {
      setError('登录服务异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-6"
      style={{
        background:
          'radial-gradient(900px 460px at 92% -6%, rgba(251,191,36,.10) 0%, rgba(251,191,36,0) 62%), radial-gradient(760px 420px at -8% 2%, rgba(22,50,79,.55) 0%, rgba(22,50,79,0) 58%), #0f2438',
      }}>
      <div className="w-full max-w-[380px] rounded-2xl border border-[#2a4a6b] bg-[#16324f] p-7 sm:p-8 shadow-[0_18px_50px_rgba(0,0,0,.45)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#0f2438] shadow-[0_10px_24px_rgba(0,0,0,.35)]">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#16324f" />
            <path d="M9 10h14M9 16h9M9 22h11" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mb-1 text-center text-xl tracking-wide text-white">AI Workflow</h1>
        <p className="mb-5 text-center text-[12.5px] text-[#93a7bd]">提示词工作台 · 登录一次，一年内本设备免重复输入</p>

        <form onSubmit={handleSubmit}>
          <label className="mb-1.5 mt-3 block text-[13px] font-bold text-[#93a7bd]">访问账号</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border-[1.5px] border-[#2a4a6b] bg-[#1c3c5e] px-3.5 py-3 text-base text-[#e8edf4] outline-none focus:border-[#fbbf24] focus:shadow-[0_0_0_4px_rgba(251,191,36,.16)]"
          />
          <label className="mb-1.5 mt-3 block text-[13px] font-bold text-[#93a7bd]">访问口令</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border-[1.5px] border-[#2a4a6b] bg-[#1c3c5e] px-3.5 py-3 text-base text-[#e8edf4] outline-none focus:border-[#fbbf24] focus:shadow-[0_0_0_4px_rgba(251,191,36,.16)]"
          />
          {error && (
            <div className="mt-3 rounded-lg bg-[#4a2724] px-2.5 py-2 text-[13.5px] font-semibold text-[#f3a9a3]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-gradient-to-br from-[#fcd34d] to-[#fbbf24] py-3 text-[15px] font-extrabold tracking-[2px] text-[#16324f] shadow-[0_10px_22px_rgba(251,191,36,.28)] transition-all hover:brightness-105 active:scale-[.98] disabled:opacity-60"
          >
            {loading ? '登录中…' : '进入系统'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[#6d8098]">手机与电脑首次登录后都会自动记住</p>
      </div>
    </main>
  );
}
