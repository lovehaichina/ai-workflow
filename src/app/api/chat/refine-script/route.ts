import { NextResponse } from 'next/server';
import { chatCompletion, type LLMMessage } from '../../llm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  currentScript: string;
  history: ChatMessage[];
  videoUrl?: string;
  // 当前工作流数据，用于智能识别微调目标
  workflowData?: {
    characters: Array<{
      name: string;
      imagePrompt?: string;
    }>;
    scenes: Array<{
      id: number;
      imagePrompt: string;
    }>;
  };
}

const SYSTEM_PROMPT = `You are an AI video analysis assistant. Your job is to analyze videos and generate storyboard scripts through conversation with the user.

{VIDEO_CONTEXT}

The user's script generation guidelines:
---
{CURRENT_SCRIPT}
---

Your task:
1. Analyze the video content if provided
2. Chat with the user to understand their requirements for the storyboard
3. When the user is satisfied or asks to generate, output the final script JSON

When generating the script, output in this JSON format:
{
  "message": "Your explanation or response to the user",
  "script": {
    "characters": [
      {
        "name": "Character Name",
        "description": "Character description",
        "imagePrompt": "Detailed prompt for generating character reference image"
      }
    ],
    "scenes": [
      {
        "id": 1,
        "imagePrompt": "Detailed prompt for storyboard image",
        "videoPrompt": "Detailed prompt for video generation"
      }
    ]
  }
}

If just chatting without generating script, set "script" to null.
All prompts in the script should be in English for best AI generation results.`;

const SYSTEM_PROMPT_NO_VIDEO = `You are an AI storyboard script assistant. Your job is to help users create storyboard scripts through conversation.

No video has been provided. You can help the user:
1. Create original storyboard scripts based on their ideas
2. Refine and adjust existing script concepts
3. Generate character designs and scene descriptions

The user's script generation guidelines:
---
{CURRENT_SCRIPT}
---

When generating the script, output in this JSON format:
{
  "message": "Your explanation or response to the user",
  "script": {
    "characters": [
      {
        "name": "Character Name",
        "description": "Character description",
        "imagePrompt": "Detailed prompt for generating character reference image"
      }
    ],
    "scenes": [
      {
        "id": 1,
        "imagePrompt": "Detailed prompt for storyboard image",
        "videoPrompt": "Detailed prompt for video generation"
      }
    ]
  }
}

If just chatting without generating script, set "script" to null.
All prompts in the script should be in English for best AI generation results.`;

// 微调模式的系统提示 - 当已有工作流数据时使用
const SYSTEM_PROMPT_REFINE = `You are an AI assistant helping to refine image generation prompts for a storyboard.

Current workflow has:
{WORKFLOW_DATA}

Your task:
1. Understand what the user wants to modify
2. Identify which specific character or scene they want to adjust
3. Generate an improved prompt ONLY for that specific item
4. Do NOT regenerate the entire script - only modify what the user asks for

When you identify what the user wants to change, output in this JSON format:
{
  "message": "Your explanation of the changes",
  "adjustment": {
    "type": "character" or "scene",
    "index": <index number starting from 0>,
    "name": "Name of the character or Scene #id",
    "newPrompt": "The improved image prompt"
  }
}

If the user wants to modify multiple items or the entire script, set "adjustment" to null and explain that they should be more specific about which character or scene to modify.

If just chatting or unclear what to modify, set "adjustment" to null.
All prompts should be in English for best AI generation results.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { message, currentScript, history, videoUrl, workflowData } = body;

    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key not configured' },
        { status: 401 }
      );
    }

    // 判断是否使用微调模式
    const hasWorkflowData = workflowData &&
      ((workflowData.characters && workflowData.characters.length > 0) ||
       (workflowData.scenes && workflowData.scenes.length > 0));

    // Build conversation history (OpenAI-compatible messages)
    const messages: LLMMessage[] = [];

    let systemContext: string;

    if (hasWorkflowData) {
      // 微调模式 - 有工作流数据时
      const workflowDataStr = [
        'Characters:',
        ...(workflowData.characters || []).map((c, i) =>
          `  ${i}. ${c.name}: "${c.imagePrompt || '(no prompt)'}"`
        ),
        'Scenes:',
        ...(workflowData.scenes || []).map((s, i) =>
          `  ${i}. Scene #${s.id}: "${s.imagePrompt}"`
        ),
      ].join('\n');

      systemContext = SYSTEM_PROMPT_REFINE.replace('{WORKFLOW_DATA}', workflowDataStr);

      messages.push({ role: 'system', content: systemContext });
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          message: 'I can help you refine the prompts for your characters and scenes. Tell me which one you\'d like to adjust and how.',
          adjustment: null,
        }),
      });
    } else {
      // 完整脚本生成模式
      systemContext = videoUrl
        ? SYSTEM_PROMPT
            .replace('{CURRENT_SCRIPT}', currentScript)
            .replace('{VIDEO_CONTEXT}', 'A video reference URL was provided (' + videoUrl + '), but the current language model does not support video understanding. Please create the storyboard from the user\'s text description, referencing the video\'s style/theme only as text.')
        : SYSTEM_PROMPT_NO_VIDEO.replace('{CURRENT_SCRIPT}', currentScript);

      messages.push({ role: 'system', content: systemContext });
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          message: videoUrl
            ? 'I\'m ready to help you create a storyboard script. Describe your story idea or provide details about what you want to create.'
            : 'I\'m ready to help you create a storyboard script. Describe your story idea or provide details about what you want to create.',
          script: null,
        }),
      });
    }

    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const responseText = await chatCompletion(messages, apiKey, {
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          message: parsed.message || responseText,
          script: parsed.script || null,
          // 微调模式返回的调整数据
          adjustment: parsed.adjustment || null,
        });
      }
    } catch {
      // If not valid JSON, return as plain message
    }

    return NextResponse.json({
      message: responseText,
      script: null,
      adjustment: null,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
