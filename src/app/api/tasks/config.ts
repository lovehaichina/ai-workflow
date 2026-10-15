import { createClient } from '@supabase/supabase-js';

// 服务端 Supabase 客户端：凭据一律从环境变量注入（仓库不包含任何真实凭据）
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// 未配置时导出 null：依赖 Supabase 的接口将返回明确错误（部署方需配置 SUPABASE_URL / SUPABASE_ANON_KEY）
export const supabaseServer: any = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// API 配置
export const API_BASE_URL = 'https://gptproto.com';

export const GEMINI_IMAGE_API = {
  TEXT_TO_IMAGE: {
    url: `${API_BASE_URL}/api/v3/google/gemini-3-pro-image-preview/text-to-image`,
  },
  IMAGE_TO_EDIT: {
    url: `${API_BASE_URL}/api/v3/google/gemini-3-pro-image-preview/image-to-edit`,
  },
};

export const TASK_API = {
  getResultUrl: (taskId: string) => `${API_BASE_URL}/api/v3/predictions/${taskId}/result`,
};

// 哈希 API Key（与客户端一致）
export function hashApiKey(apiKey: string): string {
  if (apiKey.length <= 20) {
    return apiKey;
  }
  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 8);
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  return `${prefix}...${hashStr}...${suffix}`;
}
