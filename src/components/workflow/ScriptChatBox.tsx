'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getApiKey,
  getDefaultVideoModel,
  setDefaultVideoModel,
  getDefaultVideoDuration,
  setDefaultVideoDuration,
  getDefaultImageModel,
  setDefaultImageModel,
  getDefaultImageSize,
  setDefaultImageSize,
  getDefaultAspectRatio,
  setDefaultAspectRatio,
  VIDEO_MODELS,
  IMAGE_TEXT_TO_IMAGE_MODELS,
  ASPECT_RATIOS,
  type VideoModelId,
  type ImageTextToImageModelId,
} from '@/config/api';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock, FileText, Film, Image, Layers, Loader2, MessageSquare, Paperclip, Pencil, Play, Plus, RefreshCw, RotateCcw, Send, Settings, Sparkles, Square, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

// 图片悬浮预览组件
function ImageHoverPreview({
  imageUrl,
  alt,
  className,
  imgClassName,
  previewSize = 280,
}: {
  imageUrl: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  previewSize?: number;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right + 12;
    let y = rect.top - 20;

    if (x + previewSize > window.innerWidth - 20) {
      x = rect.left - previewSize - 12;
    }

    if (y + previewSize > window.innerHeight - 20) {
      y = window.innerHeight - previewSize - 20;
    }

    if (y < 20) {
      y = 20;
    }

    setPosition({ x, y });

    timeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPreview(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        className={imgClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {showPreview && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none animate-fade-in"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl">
            <img
              src={imageUrl}
              alt={alt}
              className="object-contain rounded"
              style={{ maxWidth: previewSize, maxHeight: previewSize }}
            />
            <div
              className="mt-1.5 text-xs text-zinc-500 text-center truncate"
              style={{ maxWidth: previewSize }}
            >
              {alt}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

interface ScriptJson {
  characters: Array<{
    name: string;
    description?: string;
    imagePrompt?: string;
    RoleimagePrompt?: string;
  }>;
  scenes: Array<{
    id: number;
    imagePrompt: string;
    videoPrompt: string;
  }>;
}

// Agent 操作类型
export interface AgentAction {
  type: 'update_character_prompt' | 'update_scene_prompt' | 'regenerate_character' | 'regenerate_scene' | 'add_character' | 'add_scene' | 'reorder_character' | 'reorder_scene' | 'delete_character' | 'delete_scene';
  index: number;
  prompt?: string;
  videoPrompt?: string; // 分镜的视频提示词
  name?: string;
  toIndex?: number; // 用于 reorder 操作
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  scriptData?: ScriptJson;
  agentAction?: AgentAction;
  suggestedPrompt?: {
    type: 'character' | 'scene';
    index: number;
    name: string;
    prompt: string;
    videoPrompt?: string; // 分镜的视频提示词
    isCreate?: boolean;
  };
  // 阶段完成通知
  stageNotification?: {
    stage: 'script_done' | 'characters_done' | 'scenes_done' | 'videos_done';
    title: string;
    description: string;
    actionLabel: string;
  };
}

interface WorkflowCharacter {
  name: string;
  imagePrompt?: string;
  imageUrl?: string;
}

interface WorkflowScene {
  id: number;
  imagePrompt: string;
  imageUrl?: string;
}

interface EditTarget {
  type: 'character' | 'scene';
  index: number;
  name: string;
  currentPrompt: string;
  isCreate?: boolean;
  insertAfter?: number; // 在哪个索引之后插入，-1 表示插入到开头
}

interface ScriptChatBoxProps {
  currentScript: string;
  onApplyScript: (script: ScriptJson) => void;
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onAgentAction?: (action: AgentAction) => void;
  characters?: WorkflowCharacter[];
  scenes?: WorkflowScene[];
  // Workflow status props
  isRunning?: boolean;
  isWaiting?: boolean;
  currentStage?: string;
  backgroundStatus?: string;
  onGenerateVideos?: () => void;
  onMergeVideos?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  // Videos for merge button
  videos?: Array<{
    id: string;
    status: string;
    videoUrl?: string;
  }>;
  // Preview callback
  onPreview?: (content: { type: 'video' | 'image' | 'text'; url?: string; title: string }) => void;
  // Generate characters callback (after applying script)
  onGenerateCharacters?: () => void;
  // Generate scenes callback (after characters done)
  onGenerateScenes?: () => void;
  // Batch regenerate callbacks
  onBatchRegenerateCharacters?: () => void;
  onBatchRegenerateScenes?: () => void;
}

// 阶段完成通知卡片组件
function StageNotificationCard({
  notification,
  onAction,
  onStop,
  onRegenerate,
  isRunning,
  currentStage,
}: {
  notification: ChatMessage['stageNotification'];
  onAction: () => void;
  onStop?: () => void;
  onRegenerate?: () => void;
  isRunning?: boolean;
  currentStage?: string;
}) {
  if (!notification) return null;

  const stageConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    script_done: {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-emerald-500',
    },
    characters_done: {
      icon: <User className="w-4 h-4" />,
      color: 'text-amber-500',
    },
    scenes_done: {
      icon: <Image className="w-4 h-4" />,
      color: 'text-orange-500',
    },
    videos_done: {
      icon: <Film className="w-4 h-4" />,
      color: 'text-amber-500',
    },
  };

  const config = stageConfig[notification.stage] || stageConfig.characters_done;

  const stageOrder = ['script_done', 'characters', 'characters_done', 'scenes', 'scenes_done', 'videos', 'videos_done', 'merging', 'completed'];
  const notificationStageIndex = stageOrder.indexOf(notification.stage);
  const currentStageIndex = stageOrder.indexOf(currentStage || '');
  const canRegenerate = currentStageIndex > notificationStageIndex && onRegenerate;

  // Determine if this specific card's action is currently running
  // Each notification card triggers a specific next stage:
  // - script_done -> triggers characters generation
  // - characters_done -> triggers scenes generation
  // - scenes_done -> triggers videos generation
  // - videos_done -> triggers merging
  const nextStageMap: Record<string, string> = {
    script_done: 'characters',
    characters_done: 'scenes',
    scenes_done: 'videos',
    videos_done: 'merging',
  };
  const isThisCardRunning = isRunning && currentStage === nextStageMap[notification.stage];

  return (
    <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-md bg-zinc-700 flex items-center justify-center shrink-0', config.color)}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-medium text-zinc-200">{notification.title}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{notification.description}</p>
          </div>
        </div>

        <div className="mt-3">
          {isThisCardRunning ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onStop?.(); }}
              className="w-full h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            >
              <Square className="w-3.5 h-3.5 mr-1.5" />
              Stop
            </Button>
          ) : canRegenerate ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onRegenerate?.(); }}
              className="w-full h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Regenerate
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white"
            >
              {notification.stage === 'script_done' && <User className="w-3.5 h-3.5 mr-1.5" />}
              {notification.stage === 'characters_done' && <Image className="w-3.5 h-3.5 mr-1.5" />}
              {notification.stage === 'scenes_done' && <Film className="w-3.5 h-3.5 mr-1.5" />}
              {notification.stage === 'videos_done' && <Layers className="w-3.5 h-3.5 mr-1.5" />}
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 简化的 Prompt 建议组件
function PromptSuggestion({
  suggestion,
  onApply,
}: {
  suggestion: ChatMessage['suggestedPrompt'];
  onApply: () => void;
}) {
  if (!suggestion) return null;

  const isCreate = suggestion.isCreate || suggestion.index === -1;

  return (
    <div className={cn(
      'mt-2 p-2.5 rounded-md border',
      isCreate ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-medium', isCreate ? 'text-emerald-500' : 'text-amber-500')}>
          {isCreate ? 'New' : 'Update'}: {suggestion.name}
        </span>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onApply(); }}
          className={cn(
            'h-6 px-2 text-xs text-white',
            isCreate ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
          )}
        >
          <Check className="w-3 h-3 mr-1" />
          {isCreate ? 'Create' : 'Apply'}
        </Button>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2">{suggestion.prompt}</p>
    </div>
  );
}

// 紧凑的脚本预览组件
function ScriptPreviewCompact({
  scriptData,
  onApply,
  isApplied,
}: {
  scriptData: ScriptJson;
  onApply: () => void;
  isApplied?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const characterCount = scriptData.characters?.length || 0;
  const sceneCount = scriptData.scenes?.length || 0;

  return (
    <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-200">Script Generated</span>
          </div>
          <div className="flex items-center gap-2">
            {!isApplied ? (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onApply(); }}
                className="h-6 px-2.5 text-xs text-white bg-amber-600 hover:bg-amber-500"
              >
                <Check className="w-3 h-3 mr-1" />
                Apply
              </Button>
            ) : (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Applied
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{characterCount} Character{characterCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              <span>{sceneCount} Scene{sceneCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{expanded ? 'Hide' : 'Details'}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-zinc-700 p-3 space-y-4 bg-zinc-900/50">
          {/* Characters */}
          {scriptData.characters && scriptData.characters.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-300 mb-2">Characters</div>
              <div className="space-y-2">
                {scriptData.characters.map((char, idx) => (
                  <div key={idx} className="p-2 rounded bg-zinc-800">
                    <div className="text-sm text-zinc-200 font-medium">{char.name}</div>
                    {char.description && (
                      <div className="text-xs text-zinc-400 mt-1">{char.description}</div>
                    )}
                    {char.imagePrompt && (
                      <div className="text-xs text-zinc-400 mt-1">
                        <span className="text-zinc-500">Prompt:</span> {char.imagePrompt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenes */}
          {scriptData.scenes && scriptData.scenes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-300 mb-2">Scenes</div>
              <div className="space-y-2">
                {scriptData.scenes.map((scene, idx) => (
                  <div key={idx} className="p-2 rounded bg-zinc-800">
                    <div className="text-sm text-zinc-200 font-medium">Scene #{scene.id}</div>
                    {scene.imagePrompt && (
                      <div className="text-xs text-zinc-400 mt-1">{scene.imagePrompt}</div>
                    )}
                    {scene.videoPrompt && (
                      <div className="text-xs text-zinc-400 mt-1">
                        <span className="text-zinc-500">Video:</span> {scene.videoPrompt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScriptChatBox({
  currentScript,
  onApplyScript,
  videoUrl,
  onVideoUrlChange,
  onUpload,
  disabled = false,
  messages,
  onMessagesChange,
  onAgentAction,
  characters,
  scenes,
  // Workflow status props
  isRunning,
  isWaiting,
  currentStage,
  backgroundStatus,
  onGenerateVideos,
  onMergeVideos,
  onStop,
  onReset,
  videos,
  onPreview,
  onGenerateCharacters,
  onGenerateScenes,
  onBatchRegenerateCharacters,
  onBatchRegenerateScenes,
}: ScriptChatBoxProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [localVideoUrl, setLocalVideoUrl] = useState(videoUrl || '');
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<string>('');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [copyToast, setCopyToast] = useState('');

  // 复制文本到剪贴板（提示词模式：不调用任何直连生成）
  const copyTextToClipboard = useCallback((text: string) => {
    const doCopy = () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => {
            setCopyToast('已复制提示词到剪贴板');
          }).catch(() => fallbackCopy());
        } else {
          fallbackCopy();
        }
      } catch {
        fallbackCopy();
      }
    };
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyToast('已复制提示词到剪贴板');
    };
    doCopy();
    setTimeout(() => setCopyToast(''), 2500);
  }, []);

  // 按阶段组装提示词文本并复制
  const copyPromptsForStage = useCallback((stage?: string) => {
    const parts: string[] = [];
    if (stage === 'script_done' || stage === 'characters_done' || stage === 'scenes_done' || stage === 'videos_done' || !stage) {
      if (characters && characters.length > 0) {
        parts.push('===== 角色参考图提示词 =====');
        characters.forEach((c, idx) => {
          parts.push(`角色 ${idx + 1}（${c.name || 'unnamed'}）`);
          if (c.imagePrompt) parts.push(c.imagePrompt);
          parts.push('');
        });
      }
    }
    if (stage === 'characters_done' || stage === 'scenes_done' || stage === 'videos_done' || !stage) {
      if (scenes && scenes.length > 0) {
        parts.push('===== 分镜图提示词 =====');
        scenes.forEach((sc, idx) => {
          parts.push(`分镜 ${idx + 1}（Scene #${sc.id}）`);
          if (sc.imagePrompt) parts.push(sc.imagePrompt);
          parts.push('');
        });
      }
    }
    if (stage === 'videos_done' || !stage) {
      if (scenes && scenes.length > 0) {
        parts.push('===== 视频分段提示词 =====');
        scenes.forEach((sc, idx) => {
          parts.push(`分镜 ${idx + 1}（Scene #${sc.id}）`);
          if ((sc as unknown as { videoPrompt?: string }).videoPrompt) {
            parts.push((sc as unknown as { videoPrompt?: string }).videoPrompt as string);
          } else {
            parts.push('（无单独视频提示词，请用分镜图提示词作为视频参考）');
          }
          parts.push('');
        });
      }
    }
    const text = parts.join('\n').trim();
    if (!text) {
      setCopyToast('暂无可复制的提示词，请先生成剧本');
      setTimeout(() => setCopyToast(''), 2500);
      return;
    }
    copyTextToClipboard(text);
  }, [characters, scenes, copyTextToClipboard]);


  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModelId>(() => getDefaultVideoModel());
  const [selectedVideoDuration, setSelectedVideoDuration] = useState<number>(() => getDefaultVideoDuration());
  const [selectedImageModel, setSelectedImageModel] = useState<ImageTextToImageModelId>(() => getDefaultImageModel());
  const [selectedImageSize, setSelectedImageSize] = useState<string>(() => getDefaultImageSize());
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(() => getDefaultAspectRatio());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update localStorage when model selection changes
  const handleVideoModelChange = (model: VideoModelId) => {
    setSelectedVideoModel(model);
    setDefaultVideoModel(model);
    // Reset duration to model's default when model changes
    const modelConfig = VIDEO_MODELS[model];
    if (modelConfig.defaultDuration) {
      setSelectedVideoDuration(modelConfig.defaultDuration);
      setDefaultVideoDuration(modelConfig.defaultDuration);
    }
  };

  const handleVideoDurationChange = (duration: number) => {
    setSelectedVideoDuration(duration);
    setDefaultVideoDuration(duration);
  };

  const handleImageModelChange = (model: ImageTextToImageModelId) => {
    setSelectedImageModel(model);
    setDefaultImageModel(model);
    // Reset size to model's default when model changes
    const modelConfig = IMAGE_TEXT_TO_IMAGE_MODELS[model];
    setSelectedImageSize(modelConfig.defaultSize);
    setDefaultImageSize(modelConfig.defaultSize);
  };

  const handleImageSizeChange = (size: string) => {
    setSelectedImageSize(size);
    setDefaultImageSize(size);
  };

  const handleAspectRatioChange = (ratio: string) => {
    setSelectedAspectRatio(ratio);
    setDefaultAspectRatio(ratio);
  };

  useEffect(() => {
    setLocalVideoUrl(videoUrl || '');
    if (!videoUrl) {
      setVideoThumbnail('');
      setVideoDuration('');
    }
  }, [videoUrl]);

  const generateThumbnail = useCallback((file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      setVideoDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      video.currentTime = Math.min(1, duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        ctx.drawImage(video, x, y, size, size, 0, 0, 80, 80);
        setVideoThumbnail(canvas.toDataURL('image/jpeg', 0.7));
      }
      URL.revokeObjectURL(video.src);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('File size cannot exceed 500MB');
      return;
    }

    generateThumbnail(file);
    setUploading(true);
    setUploadProgress('Uploading...');

    try {
      const url = await onUpload(file);
      if (url) {
        setLocalVideoUrl(url);
        onVideoUrlChange?.(url);
        setUploadProgress('');
      }
    } catch (error) {
      const err = error as Error;
      setUploadProgress(`Failed: ${err.message}`);
      setVideoThumbnail('');
      setVideoDuration('');
      setTimeout(() => setUploadProgress(''), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearVideoUrl = () => {
    setLocalVideoUrl('');
    setVideoThumbnail('');
    setVideoDuration('');
    onVideoUrlChange?.('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || disabled) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    onMessagesChange([...messages, userMessage]);
    const currentInput = input.trim();
    const currentEditTarget = editTarget;
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('Please configure API Key first');

      if (currentEditTarget) {
        const response = await fetch('/api/chat/refine-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            message: currentInput,
            targetType: currentEditTarget.type,
            targetName: currentEditTarget.name,
            currentPrompt: currentEditTarget.currentPrompt,
            history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            isCreateMode: currentEditTarget.isCreate,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          suggestedPrompt: data.newPrompt ? {
            type: currentEditTarget.type,
            index: currentEditTarget.index,
            name: data.name || currentEditTarget.name,
            prompt: data.newPrompt,
            videoPrompt: data.videoPrompt || undefined, // 分镜的视频提示词
            isCreate: currentEditTarget.isCreate,
          } : undefined,
        };

        onMessagesChange([...messages, userMessage, assistantMessage]);
      } else {
        const hasWorkflowData = (characters && characters.length > 0) || (scenes && scenes.length > 0);

        const response = await fetch('/api/chat/refine-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            message: currentInput,
            currentScript,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            videoUrl: localVideoUrl,
            workflowData: hasWorkflowData ? {
              characters: characters?.map(c => ({ name: c.name, imagePrompt: c.imagePrompt })),
              scenes: scenes?.map(s => ({ id: s.id, imagePrompt: s.imagePrompt })),
            } : undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          scriptData: data.script,
          suggestedPrompt: data.adjustment ? {
            type: data.adjustment.type as 'character' | 'scene',
            index: data.adjustment.index,
            name: data.adjustment.name,
            prompt: data.adjustment.newPrompt,
          } : undefined,
        };

        onMessagesChange([...messages, userMessage, assistantMessage]);
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: new Date(),
      };
      onMessagesChange([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, disabled, currentScript, messages, localVideoUrl, onMessagesChange, editTarget, characters, scenes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApplyFromMessage = (script: ScriptJson) => {
    onApplyScript(script);
  };

  const handleApplyPromptSuggestion = (suggestion: ChatMessage['suggestedPrompt']) => {
    if (!suggestion) return;

    const isCreate = suggestion.isCreate || suggestion.index === -1;

    if (isCreate) {
      onAgentAction?.({
        type: suggestion.type === 'character' ? 'add_character' : 'add_scene',
        index: editTarget?.insertAfter !== undefined ? editTarget.insertAfter : -1,
        prompt: suggestion.prompt,
        videoPrompt: suggestion.videoPrompt, // 传递视频提示词
        name: suggestion.name,
      });
    } else {
      onAgentAction?.({
        type: suggestion.type === 'character' ? 'update_character_prompt' : 'update_scene_prompt',
        index: suggestion.index,
        prompt: suggestion.prompt,
        videoPrompt: suggestion.videoPrompt, // 传递视频提示词
      });
    }
    setEditTarget(null);
  };

  const handleSelectCharacter = (index: number) => {
    const char = characters?.[index];
    if (!char) return;
    setEditTarget({
      type: 'character',
      index,
      name: char.name,
      currentPrompt: char.imagePrompt || '',
    });
    inputRef.current?.focus();
  };

  const handleSelectScene = (index: number) => {
    const scene = scenes?.[index];
    if (!scene) return;
    setEditTarget({
      type: 'scene',
      index,
      name: `Scene #${scene.id}`,
      currentPrompt: scene.imagePrompt || '',
    });
    inputRef.current?.focus();
  };

  const handleClearEditTarget = () => {
    setEditTarget(null);
  };

  const handleRegenerateCharacter = (index: number) => {
    onAgentAction?.({ type: 'regenerate_character', index });
  };

  const handleRegenerateScene = (index: number) => {
    onAgentAction?.({ type: 'regenerate_scene', index });
  };

  const handleCreateCharacter = (insertAfter?: number) => {
    setEditTarget({
      type: 'character',
      index: -1,
      name: 'New Character',
      currentPrompt: '',
      isCreate: true,
      insertAfter: insertAfter ?? -1,
    });
    inputRef.current?.focus();
  };

  const handleCreateScene = (insertAfter?: number) => {
    setEditTarget({
      type: 'scene',
      index: -1,
      name: 'New Scene',
      currentPrompt: '',
      isCreate: true,
      insertAfter: insertAfter ?? -1,
    });
    inputRef.current?.focus();
  };

  // Move handlers for reordering
  const handleMoveCharacter = (index: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? index - 1 : index + 1;
    if (toIndex < 0 || !characters || toIndex >= characters.length) return;
    onAgentAction?.({ type: 'reorder_character', index, toIndex });
  };

  const handleMoveScene = (index: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? index - 1 : index + 1;
    if (toIndex < 0 || !scenes || toIndex >= scenes.length) return;
    onAgentAction?.({ type: 'reorder_scene', index, toIndex });
  };

  // Delete handlers
  const handleDeleteCharacter = (index: number) => {
    onAgentAction?.({ type: 'delete_character', index });
  };

  const handleDeleteScene = (index: number) => {
    onAgentAction?.({ type: 'delete_scene', index });
  };

  const hasWorkflowData = (characters && characters.length > 0) || (scenes && scenes.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Script Context */}
      {hasWorkflowData && (
        <div className="shrink-0 border-b border-zinc-700">
          {/* Header */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workflow</span>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Characters */}
          {characters && characters.length > 0 && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-300">Characters</span>
                  <span className="text-xs text-zinc-500">({characters.length})</span>
                </div>
                <button
                  onClick={() => handleCreateCharacter(characters.length - 1)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto p-2">
                {characters.map((char, idx) => {
                  const isSelected = editTarget?.type === 'character' && editTarget?.index === idx;
                  const canMoveLeft = idx > 0;
                  const canMoveRight = idx < characters.length - 1;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'shrink-0 group relative flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded transition-all',
                        isSelected
                          ? 'bg-amber-500/10 ring-1 ring-amber-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      )}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(idx); }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-600 hover:bg-red-500 text-zinc-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveCharacter(idx, 'left'); }}
                        disabled={!canMoveLeft}
                        className={cn(
                          'p-0.5 rounded transition-all',
                          canMoveLeft
                            ? 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                            : 'hidden'
                        )}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleSelectCharacter(idx)}
                        className="flex items-center gap-1.5"
                      >
                        {char.imageUrl ? (
                          <ImageHoverPreview
                            imageUrl={char.imageUrl}
                            alt={char.name}
                            imgClassName="w-6 h-6 rounded object-cover"
                            previewSize={200}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-zinc-400" />
                          </div>
                        )}
                        <span className="text-xs text-zinc-200 max-w-[50px] truncate">{char.name}</span>
                      </button>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerateCharacter(idx); }}
                          className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveCharacter(idx, 'right'); }}
                          disabled={!canMoveRight}
                          className={cn(
                            'p-0.5 rounded transition-all',
                            canMoveRight
                              ? 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                              : 'hidden'
                          )}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scenes */}
          {scenes && scenes.length > 0 && (
            <div className={cn('px-3 py-2', characters && characters.length > 0 && 'border-t border-zinc-700')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Image className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-300">Scenes</span>
                  <span className="text-xs text-zinc-500">({scenes.length})</span>
                </div>
                <button
                  onClick={() => handleCreateScene(scenes.length - 1)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto p-2">
                {scenes.map((scene, idx) => {
                  const isSelected = editTarget?.type === 'scene' && editTarget?.index === idx;
                  const canMoveLeft = idx > 0;
                  const canMoveRight = idx < scenes.length - 1;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'shrink-0 group relative flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded transition-all',
                        isSelected
                          ? 'bg-amber-500/10 ring-1 ring-amber-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      )}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteScene(idx); }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-600 hover:bg-red-500 text-zinc-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveScene(idx, 'left'); }}
                        disabled={!canMoveLeft}
                        className={cn(
                          'p-0.5 rounded transition-all',
                          canMoveLeft
                            ? 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                            : 'hidden'
                        )}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleSelectScene(idx)}
                        className="flex items-center gap-1.5"
                      >
                        {scene.imageUrl ? (
                          <ImageHoverPreview
                            imageUrl={scene.imageUrl}
                            alt={`Scene ${scene.id}`}
                            imgClassName="w-8 h-6 rounded object-cover"
                            previewSize={280}
                          />
                        ) : (
                          <div className="w-8 h-6 rounded bg-zinc-700 flex items-center justify-center">
                            <Image className="w-3 h-3 text-zinc-400" />
                          </div>
                        )}
                        <span className="text-xs text-zinc-200">#{scene.id}</span>
                      </button>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerateScene(idx); }}
                          className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveScene(idx, 'right'); }}
                          disabled={!canMoveRight}
                          className={cn(
                            'p-0.5 rounded transition-all',
                            canMoveRight
                              ? 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                              : 'hidden'
                          )}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0" ref={scrollRef}>
        <div className="py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                {hasWorkflowData ? 'Click a card to edit' : localVideoUrl ? 'Describe your storyboard' : 'Describe your story'}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img src="/gptproto.png" alt="GPTProto" className="w-5 h-5 object-contain" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-800 text-zinc-200'
                )}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                {message.scriptData && (
                  <ScriptPreviewCompact
                    scriptData={message.scriptData}
                    onApply={() => handleApplyFromMessage(message.scriptData!)}
                    isApplied={hasWorkflowData}
                  />
                )}
                {message.suggestedPrompt && (
                  <PromptSuggestion
                    suggestion={message.suggestedPrompt}
                    onApply={() => handleApplyPromptSuggestion(message.suggestedPrompt)}
                  />
                )}
                {message.stageNotification && (
                  <StageNotificationCard
                    notification={message.stageNotification}
                    onAction={() => {
                      copyPromptsForStage(message.stageNotification?.stage);
                    }}
                    onRegenerate={() => {
                      // 提示词模式：不重新生成，复制全部提示词
                      copyPromptsForStage(undefined);
                    }}
                    onStop={onStop}
                    isRunning={isRunning}
                    currentStage={currentStage}
                  />
                )}
              </div>
              {message.role === 'user' && (
                <div className="shrink-0 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                <img src="/gptproto.png" alt="GPTProto" className="w-5 h-5 object-contain" />
              </div>
              <div className="bg-zinc-800 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 space-y-2 border-t border-zinc-700">
        {copyToast && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
            {copyToast}
          </div>
        )}
        {/* Edit Target Indicator */}
        {editTarget && (
          <div className={cn(
            'flex items-center justify-between px-3 py-1.5 rounded text-xs',
            'bg-zinc-800 text-zinc-300'
          )}>
            <div className="flex items-center gap-2">
              <Pencil className="w-3 h-3" />
              <span>
                {editTarget.isCreate ? 'Creating' : 'Editing'}: {editTarget.name}
              </span>
            </div>
            <button onClick={handleClearEditTarget} className="p-0.5 hover:bg-zinc-700 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Video Thumbnail */}
        {(videoThumbnail || uploading) && (
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg bg-zinc-800 border border-zinc-700',
              !uploading && localVideoUrl && onPreview && 'cursor-pointer hover:bg-zinc-700 transition-colors'
            )}
            onClick={() => {
              if (!uploading && localVideoUrl && onPreview) {
                onPreview({
                  type: 'video',
                  url: localVideoUrl,
                  title: 'Input Video',
                });
              }
            }}
          >
            <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-700 shrink-0">
              {videoThumbnail ? (
                <>
                  <img src={videoThumbnail} alt="Video" className="w-full h-full object-cover" />
                  {!uploading && localVideoUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-200 font-medium">
                {uploading ? 'Uploading...' : 'Video ready'}
              </div>
              {videoDuration && (
                <div className="text-xs text-zinc-400">{videoDuration}</div>
              )}
            </div>
            {!uploading && (
              <button
                onClick={(e) => { e.stopPropagation(); clearVideoUrl(); }}
                className="shrink-0 p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 提示词模式说明 */}
        {showModelSettings && (
          <div className="mb-3 p-4 rounded-xl bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-zinc-200">提示词模式</span>
              <span className="ml-auto px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">已启用</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              本工具只产出
              <span className="text-zinc-200"> 剧本、角色参考图提示词、分镜图提示词、视频分段提示词 </span>
              ，不直接调用生成服务。拿到提示词后，请到
              <span className="text-zinc-200"> RunningHub 等第三方平台 </span>
              自行生成图片与视频。
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">1</span>
                <span>在下方描述你的故事（或粘贴参考视频链接，仅作风格参考）</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">2</span>
                <span>AI 生成剧本、角色与分镜提示词，确认后应用到画布</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">3</span>
                <span>复制提示词，粘贴到 RunningHub 无限画布执行生成</span>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          {/* Settings Toggle Button */}
          <button
            onClick={() => setShowModelSettings(!showModelSettings)}
            className={cn(
              'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
              'hover:text-zinc-200 hover:bg-zinc-800',
              'transition-colors',
              showModelSettings ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            )}
            title="Model Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploading || disabled}
                className={cn(
                  'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                  'hover:text-zinc-200 hover:bg-zinc-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                  input.trim() ? 'text-white' : 'text-zinc-400'
                )}
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              editTarget
                ? `Describe changes for ${editTarget.name}...`
                : hasWorkflowData
                  ? 'Ask to modify...'
                  : 'Describe your story...'
            }
            disabled={isLoading || disabled}
            className={cn(
              'flex-1 h-9 text-sm bg-zinc-800 border-zinc-700 text-zinc-200',
              'placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-0 rounded-lg px-3'
            )}
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || disabled}
            className={cn(
              'shrink-0 w-9 h-9 rounded-lg p-0',
              'bg-amber-600 hover:bg-amber-500',
              'disabled:opacity-50 disabled:bg-zinc-700'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
