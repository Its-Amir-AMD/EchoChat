import React, { useState } from 'react';
import {
  Search,
  Pin,
  BellOff,
  Check,
  CheckCheck,
  Users,
  Radio,
  Bot,
  Plus,
  MoreVertical,
  Trash2,
  VolumeX,
  Volume2,
  X
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Conversation } from '../../types/chat';

interface ConversationListProps {
  onCreateGroupClick: () => void;
  onCreateChannelClick: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onCreateGroupClick,
  onCreateChannelClick,
}) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeFolder,
    searchQuery,
    setSearchQuery,
    togglePinConversation,
    toggleMuteConversation,
    clearConversationHistory,
    typingUsers,
    language,
  } = useChat();

  const isFa = language === 'fa';
  const [contextMenuConvId, setContextMenuConvId] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Filter conversations by active folder and search query
  const filteredConversations = conversations.filter(conv => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = conv.title.toLowerCase().includes(q);
      const matchUser = conv.username?.toLowerCase().includes(q);
      const matchLast = conv.lastMessage?.content.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchLast) return false;
    }

    // Folder match
    if (activeFolder === 'direct') return conv.type === 'direct';
    if (activeFolder === 'groups') return conv.type === 'group';
    if (activeFolder === 'channels') return conv.type === 'channel';
    if (activeFolder === 'bots') return conv.type === 'bot';
    if (activeFolder === 'unread') return conv.unreadCount > 0;
    return true; // 'all'
  });

  // Sort: pinned first, then by last message/update
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Search Bar & Action Buttons */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isFa ? 'جستجو در چت‌ها و پیام‌ها...' : 'Search chats & messages...'}
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl py-2 pl-9 pr-8 rtl:pl-8 rtl:pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Plus Button for creating Group or Channel */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-9 h-9 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all border border-cyan-500/20"
            title={isFa ? 'گفتگوی جدید' : 'New Chat'}
          >
            <Plus className="w-4 h-4" />
          </button>

          {showNewMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNewMenu(false)} />
              <div className="absolute top-11 right-0 rtl:right-auto rtl:left-0 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-40 text-xs flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onCreateGroupClick();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-right rtl:text-right"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'ایجاد گروه جدید' : 'New Group'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onCreateChannelClick();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-right rtl:text-right"
                >
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'ایجاد کانال جدید' : 'New Channel'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs px-4 text-center">
            <p>{isFa ? 'هیچ گفتگویی یافت نشد.' : 'No conversations found.'}</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-cyan-400 hover:underline"
              >
                {isFa ? 'پاک کردن جستجو' : 'Clear search'}
              </button>
            )}
          </div>
        ) : (
          sortedConversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const isTyping = typingUsers.includes(conv.title);

            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setContextMenuConvId(null);
                }}
                className={`relative px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors group select-none ${
                  isActive
                    ? 'bg-slate-800/90 text-white'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                {/* Avatar with indicator */}
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.title}
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-800 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  {conv.type === 'bot' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                      <Bot className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {conv.type === 'channel' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                      <Radio className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {conv.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                      <Users className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
                      <span>{conv.title}</span>
                      {conv.isMuted && <BellOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {conv.updatedAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    {/* Last message or Typing indicator */}
                    <div className="text-xs text-slate-400 truncate flex-1 flex items-center gap-1">
                      {isTyping ? (
                        <span className="text-cyan-400 animate-pulse font-medium">
                          {isFa ? 'در حال نوشتن...' : 'typing...'}
                        </span>
                      ) : conv.lastMessage ? (
                        <>
                          {conv.lastMessage.senderId === 'user_me' && (
                            <span className="text-cyan-400 shrink-0">
                              {conv.lastMessage.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                              ) : conv.lastMessage.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                          <span className="truncate">{conv.lastMessage.content}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic">
                          {isFa ? 'هیچ پیامی نیست' : 'No messages'}
                        </span>
                      )}
                    </div>

                    {/* Unread badge & Pin icon */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isPinned && <Pin className="w-3 h-3 text-cyan-400 rotate-45" />}
                      {conv.unreadCount > 0 && (
                        <span className="bg-cyan-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick 3-dots Context Menu Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setContextMenuConvId(contextMenuConvId === conv.id ? null : conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-opacity"
                  title={isFa ? 'گزینه‌ها' : 'Options'}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Context Menu Dropdown */}
                {contextMenuConvId === conv.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setContextMenuConvId(null)} />
                    <div className="absolute top-10 right-2 rtl:right-auto rtl:left-2 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-40 text-xs flex flex-col gap-0.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          togglePinConversation(conv.id);
                          setContextMenuConvId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{conv.isPinned ? (isFa ? 'برداشتن سنجاق' : 'Unpin') : (isFa ? 'سنجاق کردن' : 'Pin to top')}</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleMuteConversation(conv.id);
                          setContextMenuConvId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        {conv.isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>{conv.isMuted ? (isFa ? 'با صدا' : 'Unmute') : (isFa ? 'بی‌صدا' : 'Mute notifications')}</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          clearConversationHistory(conv.id);
                          setContextMenuConvId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isFa ? 'پاک کردن تاریخچه' : 'Clear History'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
