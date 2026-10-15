/**
 * Unified LLM Chat API (OpenAI-compatible)
 * 默认 DeepSeek，可通过环境变量 LLM_BASE_URL / LLM_MODEL 覆盖
 */

export const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1';
export const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-chat';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(
  messages: LLMMessage[],
  apiKey: string,
  options?: LLMOptions
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 8192;

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
  }

  return data.choices?.[0]?.message?.content || '';
}
