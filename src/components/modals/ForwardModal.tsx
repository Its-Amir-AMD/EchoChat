import React from 'react';
import { X, Share2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Message } from '../../types/chat';

interface ForwardModalProps {
  message: Message | null;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, onClose }) => {
  const { conversations, forwardMessage, language } = useChat();
  const isFa = language === 'fa';

  if (!message) return null;

  const handleSelect = (convId: string) => {
    forwardMessage(message.id, convId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Share2 className="w-4 h-4" />
            <span>{isFa ? 'هدایت پیام به...' : 'Forward message to...'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snippet */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400 italic truncate">
          "{message.content}"
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className="p-2.5 flex items-center gap-3 hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
            >
              <img
                src={conv.avatar}
                alt={conv.title}
                className="w-10 h-10 rounded-2xl object-cover bg-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs text-slate-100 truncate">{conv.title}</h4>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {conv.type === 'group' ? 'گروه' : conv.type === 'channel' ? 'کانال' : 'چت خصوصی'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
