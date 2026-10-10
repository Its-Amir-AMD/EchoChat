import React from 'react';
import {
  Phone,
  Video,
  Info,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bot,
  Users,
  Radio
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ChatHeaderProps {
  onBackClick: () => void;
  onOpenInfo: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBackClick,
  onOpenInfo,
  onToggleAiDrawer,
  isAiDrawerOpen,
}) => {
  const { activeConversation, contacts, startCall, language, typingUsers } = useChat();
  const isFa = language === 'fa';

  if (!activeConversation) return null;

  // Determine call recipient
  const targetUser = contacts.find(c => activeConversation.participantIds.includes(c.id)) || {
    id: activeConversation.id,
    name: activeConversation.title,
    username: activeConversation.username || '',
    avatar: activeConversation.avatar,
    status: 'online',
  };

  const isGroup = activeConversation.type === 'group';
  const isChannel = activeConversation.type === 'channel';
  const isBot = activeConversation.type === 'bot';
  const isDirect = activeConversation.type === 'direct';

  const isTyping = typingUsers.includes(activeConversation.title);

  // Subtitle text
  let statusText = '';
  if (isTyping) {
    statusText = isFa ? 'در حال نوشتن...' : 'typing...';
  } else if (isGroup) {
    statusText = isFa
      ? `${activeConversation.participantIds.length} عضو`
      : `${activeConversation.participantIds.length} members`;
  } else if (isChannel) {
    statusText = isFa
      ? `${(activeConversation.subscribersCount || 0).toLocaleString('fa-IR')} دنبال‌کننده`
      : `${(activeConversation.subscribersCount || 0).toLocaleString()} subscribers`;
  } else if (isBot) {
    statusText = isFa ? 'ربات هوشمند رسمی' : 'Official Smart Bot';
  } else if (activeConversation.id === 'conv_saved') {
    statusText = isFa ? 'فضای ابری شخصی شما' : 'Your Personal Cloud';
  } else {
    statusText = isFa ? 'آنلاین' : 'Online';
  }

  return (
    <header className="h-16 px-4 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-10 select-none">
      {/* Left / Start: Back button (on mobile) + Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBackClick}
          className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={isFa ? 'بازگشت' : 'Back'}
        >
          {isFa ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <div
          onClick={onOpenInfo}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <div className="relative shrink-0">
            <img
              src={activeConversation.avatar}
              alt={activeConversation.title}
              className="w-10 h-10 rounded-2xl object-cover bg-slate-800 shadow"
              referrerPolicy="no-referrer"
            />
            {isDirect && activeConversation.id !== 'conv_saved' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors truncate flex items-center gap-1.5">
              <span>{activeConversation.title}</span>
              {isBot && <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              {isChannel && <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              {isGroup && <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {statusText}
            </p>
          </div>
        </div>
      </div>

      {/* Right / End: Voice Call, Video Call, AI Assistant, Info Drawer */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Call buttons (available for direct chats) */}
        {isDirect && activeConversation.id !== 'conv_saved' && (
          <>
            <button
              onClick={() => startCall(targetUser, 'voice')}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
              title={isFa ? 'تماس صوتی' : 'Voice Call'}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => startCall(targetUser, 'video')}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
              title={isFa ? 'تماس تصویری' : 'Video Call'}
            >
              <Video className="w-4 h-4" />
            </button>
          </>
        )}

        {/* AI Assistant Drawer Toggle */}
        <button
          onClick={onToggleAiDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            isAiDrawerOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
          }`}
          title={isFa ? 'دستیار هوش مصنوعی' : 'AI Assistant Tools'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isFa ? 'دستیار هوش مصنوعی' : 'AI Tools'}</span>
        </button>

        {/* Info Drawer button */}
        <button
          onClick={onOpenInfo}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isFa ? 'اطلاعات گفتگو' : 'Chat Info'}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
