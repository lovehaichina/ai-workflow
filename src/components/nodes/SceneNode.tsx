'use client';

import { memo, useState } from 'react';
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, X, Loader2, Image as ImageIcon, Film, Copy, Pencil, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyTextToClipboard } from '@/lib/clipboard';
import type { ImageNodeData, NodeStatus } from '@/types/workflow';

const statusConfig: Record<NodeStatus, {
  border: string;
  dot: string;
  text: string;
}> = {
  pending: {
    border: 'border-zinc-700/60',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
  },
  running: {
    border: 'border-amber-500/50',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
  },
  success: {
    border: 'border-emerald-500/50',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
  error: {
    border: 'border-red-500/50',
    dot: 'bg-red-400',
    text: 'text-red-400',
  },
};

// 单段提示词块：标题 + 内容(截断/展开) + 复制/编辑
function PromptBlock({
  title,
  icon,
  content,
  onEdit,
}: {
  title: string;
  icon: React.ReactNode;
  content?: string;
  onEdit?: (newPrompt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(content || '');
  const [copied, setCopied] = useState(false);

  if (!content) {
    return (
      <div className="rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">{icon}{title}</div>
        <div className="text-[11px] text-zinc-600">暂无提示词</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 px-2.5 py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">{icon}{title}</div>
        <div className="flex items-center gap-0.5">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setEdited(content); }}
              title="编辑提示词"
              className="p-1 rounded-md text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyTextToClipboard(content).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            title="复制提示词"
            className={cn(
              'p-1 rounded-md transition-colors',
              copied ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10'
            )}
          >
            {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-24 resize-none bg-transparent text-xs text-zinc-200 leading-relaxed outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); if (onEdit && edited.trim()) onEdit(edited.trim()); setEditing(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-white bg-amber-500 hover:bg-amber-400 transition-colors"
            >
              <Check className="w-3 h-3" />保存
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(false); setEdited(content); }}
              className="px-2 py-1 rounded-md text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3 h-3" />取消
            </button>
          </div>
        </>
      ) : (
        <>
          <p
            className={cn(
              'text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words',
              !expanded && 'line-clamp-3'
            )}
          >
            {content}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
          >
            {expanded ? '收起' : '展开全文'}
          </button>
        </>
      )}
    </div>
  );
}

function SceneNode({ data }: NodeProps<ImageNodeData>) {
  const { label, prompt, videoPrompt, status, error, onEditPrompt } = data;
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'relative px-3 py-2.5 rounded-2xl border-2 w-[300px]',
        'bg-zinc-950/90 backdrop-blur-sm transition-colors',
        config.border
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 !border-zinc-500 hover:!scale-125 transition-all duration-200"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 shrink-0', config.text)}>
          <Film className="w-3.5 h-3.5" />
        </div>
        <div className="text-sm font-semibold text-zinc-100">{label}</div>
        {status === 'running' ? (
          <Loader2 className={cn('w-4 h-4 animate-spin ml-auto shrink-0', config.text)} />
        ) : (
          <div className={cn('w-2 h-2 rounded-full ml-auto shrink-0', config.dot)} />
        )}
      </div>

      <div className="space-y-2">
        <PromptBlock
          title="分镜图提示词"
          icon={<ImageIcon className="w-3 h-3" />}
          content={prompt}
          onEdit={onEditPrompt}
        />
        <PromptBlock
          title="视频提示词"
          icon={<Film className="w-3 h-3" />}
          content={videoPrompt}
        />
      </div>

      {status === 'error' && error && (
        <div className="mt-1.5 text-[11px] text-red-400">{error}</div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 !border-zinc-500 hover:!scale-125 transition-all duration-200"
      />
    </div>
  );
}

export default memo(SceneNode);
