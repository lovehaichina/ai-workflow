'use client';

import { memo, useState } from 'react';
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, X, Loader2, User, Copy, Pencil, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyTextToClipboard } from '@/lib/clipboard';
import type { CharacterNodeData, NodeStatus } from '@/types/workflow';

const statusConfig: Record<NodeStatus, {
  border: string;
  bg: string;
  dot: string;
  text: string;
}> = {
  pending: {
    border: 'border-zinc-700/60',
    bg: 'bg-zinc-900',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
  },
  running: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/30',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
  },
  success: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/20',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
  error: {
    border: 'border-red-500/50',
    bg: 'bg-red-950/20',
    dot: 'bg-red-400',
    text: 'text-red-400',
  },
};

function CharacterNode({ data }: NodeProps<CharacterNodeData>) {
  const { label, characterName, prompt, description, status, error, onEditPrompt } = data;
  const config = statusConfig[status];
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prompt) return;
    copyTextToClipboard(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditPrompt && editedPrompt.trim()) {
      onEditPrompt(editedPrompt.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'relative px-3 py-2.5 rounded-2xl border-2 w-[280px]',
        'bg-zinc-950/90 backdrop-blur-sm transition-colors',
        config.border,
        !editing && 'cursor-pointer hover:border-amber-400/40'
      )}
      onClick={() => {
        if (!editing) setExpanded((v) => !v);
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 !border-zinc-500 hover:!scale-125 transition-all duration-200"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800 shrink-0', config.text)}>
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-zinc-100 truncate">{characterName || label || '角色'}</div>
          {description && (
            <div className="text-[11px] text-zinc-500 truncate">{description}</div>
          )}
        </div>
        {/* Status dot */}
        {status === 'running' ? (
          <Loader2 className={cn('w-4 h-4 animate-spin shrink-0', config.text)} />
        ) : (
          <div className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
        )}
      </div>

      {/* Prompt area */}
      {prompt ? (
        <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 px-2.5 py-2">
          {editing ? (
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-28 resize-none bg-transparent text-xs text-zinc-200 leading-relaxed outline-none"
              autoFocus
            />
          ) : (
            <p
              className={cn(
                'text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words',
                !expanded && 'line-clamp-4'
              )}
            >
              {prompt}
            </p>
          )}

          {/* Actions */}
          {!editing && (
            <div className="flex items-center justify-between mt-1.5">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {expanded ? '收起' : '展开全文'}
              </button>
              <div className="flex items-center gap-1">
                {onEditPrompt && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true); setEditedPrompt(prompt); }}
                    title="编辑提示词"
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    编辑
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  title="复制提示词"
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] transition-colors',
                    copied ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10'
                  )}
                >
                  {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          )}

          {/* Editing actions */}
          {editing && (
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-white bg-amber-500 hover:bg-amber-400 transition-colors"
              >
                <Check className="w-3 h-3" />
                保存
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(false); setEditedPrompt(prompt || ''); }}
                className="px-2 py-1 rounded-md text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3 h-3" />
                取消
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 px-2.5 py-2 text-[11px] text-zinc-500">
          暂无提示词
        </div>
      )}

      {/* Error */}
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

export default memo(CharacterNode);
