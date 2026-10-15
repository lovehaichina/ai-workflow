'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, X, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData, NodeStatus } from '@/types/workflow';

const statusConfig: Record<NodeStatus, {
  bg: string;
  border: string;
  iconBg: string;
  text: string;
  handleColor: string;
}> = {
  pending: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-700/60',
    iconBg: 'bg-zinc-800',
    text: 'text-zinc-400',
    handleColor: '#71717a',
  },
  running: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/50',
    iconBg: 'bg-amber-500',
    text: 'text-amber-400',
    handleColor: '#f59e0b',
  },
  success: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/50',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-400',
    handleColor: '#10b981',
  },
  error: {
    bg: 'bg-red-950/20',
    border: 'border-red-500/50',
    iconBg: 'bg-red-500',
    text: 'text-red-400',
    handleColor: '#ef4444',
  },
};

const StatusIcon = ({ status }: { status: NodeStatus }) => {
  switch (status) {
    case 'success':
      return <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />;
    case 'error':
      return <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />;
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />;
    default:
      return <div className="w-2 h-2 rounded-full bg-zinc-500" />;
  }
};

function WorkflowNode({ data }: NodeProps<WorkflowNodeData>) {
  const { label, icon, description, status, onPreview, previewData } = data;
  const config = statusConfig[status];
  const hasPreview = status === 'success' && previewData && onPreview;

  const handleClick = () => {
    if (hasPreview && previewData) {
      onPreview({
        type: previewData.type,
        text: previewData.text,
        title: previewData.title,
        editable: previewData.editable,
        onSaveText: previewData.onSaveText,
      });
    }
  };

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-2xl border-2 min-w-[210px]',
        'bg-zinc-950/90 backdrop-blur-sm transition-colors',
        config.bg,
        config.border,
        hasPreview && 'cursor-pointer hover:border-emerald-400/40'
      )}
      onClick={handleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 hover:!scale-125 transition-all duration-200"
        style={{ borderColor: config.handleColor }}
      />

      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            'flex items-center justify-center w-11 h-11 rounded-xl',
            'bg-gradient-to-br from-zinc-800 to-zinc-900',
            'border border-zinc-700/60',
            'shadow-inner',
            config.text
          )}>
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
            {label}
            {hasPreview && <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          {description && (
            <div className={cn('text-xs mt-0.5 truncate max-w-[140px]', config.text)}>
              {description}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full',
            'transition-all duration-300',
            config.iconBg
          )}
        >
          <StatusIcon status={status} />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-700 !border-2 hover:!scale-125 transition-all duration-200"
        style={{ borderColor: config.handleColor }}
      />
    </div>
  );
}

export default memo(WorkflowNode);
