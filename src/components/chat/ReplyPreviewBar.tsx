import React from 'react';
import { Reply, X } from 'lucide-react';
import { ReplyContext } from '../../types/chat';

interface ReplyPreviewBarProps {
  replyContext: ReplyContext | null;
  onCancel: () => void;
  isFa: boolean;
}

export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({
  replyContext,
  onCancel,
  isFa,
}) => {
  if (!replyContext) return null;

  return (
    <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs select-none">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
          <Reply className="w-3.5 h-3.5 rtl:-scale-x-100" />
        </div>
        <div className="border-r-2 rtl:border-r-2 rtl:border-l-0 border-l-0 border-cyan-400 pr-2 rtl:pr-2 rtl:pl-0 pl-0 min-w-0 flex-1">
          <span className="text-[11px] font-bold text-cyan-400 block truncate">
            {isFa ? `پاسخ به ${replyContext.senderName}` : `Replying to ${replyContext.senderName}`}
          </span>
          <p className="text-[11px] text-slate-400 truncate">
            {replyContext.content}
          </p>
        </div>
      </div>

      <button
        onClick={onCancel}
        className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        title={isFa ? 'انصراف' : 'Cancel'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
