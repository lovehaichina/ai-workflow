'use client';

import { cn } from '@/lib/utils';
import { Key, Sparkles } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
  onApiKeyClick: () => void;
}

export function Navbar({ hasApiKey, onApiKeyClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-zinc-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">AI Workflow</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              提示词模式
            </span>
          </div>
        </div>

        {/* API Key Button */}
        <button
          onClick={onApiKeyClick}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            hasApiKey
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          )}
        >
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">{hasApiKey ? 'API Key' : 'Set API Key'}</span>
        </button>
      </div>
    </header>
  );
}
