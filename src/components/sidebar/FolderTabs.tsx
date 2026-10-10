import React from 'react';
import { useChat } from '../../context/ChatContext';
import { FolderCategory } from '../../types/chat';

export const FolderTabs: React.FC = () => {
  const { activeFolder, setActiveFolder, conversations, language } = useChat();
  const isFa = language === 'fa';

  // Calculate unread counts per folder
  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const directUnread = conversations.filter(c => c.type === 'direct').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const groupUnread = conversations.filter(c => c.type === 'group').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const channelUnread = conversations.filter(c => c.type === 'channel').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const botUnread = conversations.filter(c => c.type === 'bot').reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const folders: { id: FolderCategory; label: string; count?: number }[] = [
    { id: 'all', label: isFa ? 'همه' : 'All', count: unreadTotal },
    { id: 'direct', label: isFa ? 'خصوصی' : 'Direct', count: directUnread },
    { id: 'groups', label: isFa ? 'گروه‌ها' : 'Groups', count: groupUnread },
    { id: 'channels', label: isFa ? 'کانال‌ها' : 'Channels', count: channelUnread },
    { id: 'bots', label: isFa ? 'ربات‌ها' : 'Bots', count: botUnread },
    { id: 'unread', label: isFa ? 'خوانده‌نشده' : 'Unread', count: unreadTotal },
  ];

  return (
    <div className="w-full px-3 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none">
      {folders.map(f => {
        const isActive = activeFolder === f.id;
        return (
          <button
            key={f.id}
            onClick={() => setActiveFolder(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>{f.label}</span>
            {f.count !== undefined && f.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
