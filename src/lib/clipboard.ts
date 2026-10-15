// 通用剪贴板工具（提示词复制用）
// 优先 navigator.clipboard（https 安全上下文），带超时降级到 execCommand，
// 避免权限弹窗挂起时按钮状态卡死。
export function copyTextToClipboard(text: string): Promise<void> {
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return Promise.resolve();
      return Promise.reject(new Error('execCommand copy failed'));
    } catch (e) {
      return Promise.reject(e as Error);
    }
  };

  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 300ms 未完成（权限弹窗挂起/等待用户授权）则走降级路径
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            fallback().then(resolve, reject);
          }
        }, 300);
        navigator.clipboard.writeText(text).then(
          () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve();
            }
          },
          () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              fallback().then(resolve, reject);
            }
          }
        );
      });
    }
    return fallback();
  } catch {
    return fallback();
  }
}
