import React from 'react';
import { Pin, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Message } from '../../types/chat';

interface PinnedMessageBarProps {
  pinnedMessage?: Message;
  onScrollToMessage: (id: string) => void;
}

export const PinnedMessageBar: React.FC<PinnedMessageBarProps> = ({
  pinnedMessage,
  onScrollToMessage,
}) => {
  const { unpinMessage, language } = useChat();
  const isFa = language === 'fa';

  if (!pinnedMessage) return null;

  return (
    <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs select-none backdrop-blur-sm z-10">
      <div
        onClick={() => onScrollToMessage(pinnedMessage.id)}
        className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
      >
        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
          <Pin className="w-3.5 h-3.5 rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-cyan-400 block">
            {isFa ? 'پیام سنجاق‌شده' : 'Pinned Message'}
          </span>
          <p className="text-slate-300 truncate group-hover:text-white transition-colors">
            {pinnedMessage.content}
          </p>
        </div>
      </div>

      <button
        onClick={() => unpinMessage(pinnedMessage.id)}
        className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        title={isFa ? 'برداشتن سنجاق' : 'Unpin'}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
