import React from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Globe,
  Volume2,
  VolumeX,
  Compass,
  Sparkles
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface SidebarNavProps {
  activeTab: 'chats' | 'contacts' | 'calls' | 'saved' | 'ai';
  setActiveTab: (tab: 'chats' | 'contacts' | 'calls' | 'saved' | 'ai') => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
}) => {
  const {
    currentUser,
    language,
    setLanguage,
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    setActiveConversationId,
  } = useChat();

  const isFa = language === 'fa';

  const navItems = [
    {
      id: 'chats',
      label: isFa ? 'گفتگوها' : 'Chats',
      icon: MessageSquare,
      onClick: () => setActiveTab('chats'),
    },
    {
      id: 'ai',
      label: isFa ? 'هوش مصنوعی' : 'Echo AI',
      icon: Sparkles,
      onClick: () => {
        setActiveTab('chats');
        setActiveConversationId('conv_ai');
      },
    },
    {
      id: 'contacts',
      label: isFa ? 'مخاطبین' : 'Contacts',
      icon: Users,
      onClick: () => setActiveTab('contacts'),
    },
    {
      id: 'calls',
      label: isFa ? 'تماس‌ها' : 'Calls',
      icon: Phone,
      onClick: () => setActiveTab('calls'),
    },
    {
      id: 'saved',
      label: isFa ? 'ذخیره‌شده' : 'Saved',
      icon: Bookmark,
      onClick: () => {
        setActiveTab('chats');
        setActiveConversationId('conv_saved');
      },
    },
  ];

  return (
    <aside className="w-16 md:w-20 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-4 justify-between shrink-0 select-none z-20">
      {/* Top: Logo & Main Navigation */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* EchoChat Brand Logo */}
        <button
          onClick={() => {
            setActiveTab('chats');
            setActiveConversationId('conv_ai');
          }}
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
          title="EchoChat"
        >
          <Compass className="w-6 h-6 text-white group-hover:rotate-45 transition-transform duration-300" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-cyan-400' : 'group-hover:scale-110'} transition-transform`} />
                <span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-[48px]">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Utilities & User Avatar */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title={soundEnabled ? (isFa ? 'صداها فعال' : 'Sound On') : (isFa ? 'صداها خاموش' : 'Sound Muted')}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title={theme === 'dark' ? (isFa ? 'حالت روشن' : 'Light Mode') : (isFa ? 'حالت تاریک' : 'Dark Mode')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(isFa ? 'en' : 'fa')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors text-xs font-bold"
          title={isFa ? 'Switch to English (LTR)' : 'تغییر به فارسی (RTL)'}
        >
          <div className="flex items-center gap-0.5">
            <Globe className="w-3.5 h-3.5" />
            <span>{isFa ? 'FA' : 'EN'}</span>
          </div>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title={isFa ? 'تنظیمات' : 'Settings'}
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-slate-800 my-1" />

        {/* Current User Avatar with Status indicator */}
        <button
          onClick={onOpenProfile}
          className="relative group p-0.5 rounded-full hover:ring-2 hover:ring-cyan-400 transition-all"
          title={currentUser.name}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover bg-slate-800"
            referrerPolicy="no-referrer"
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
              currentUser.status === 'online'
                ? 'bg-emerald-400'
                : currentUser.status === 'busy'
                ? 'bg-rose-500'
                : currentUser.status === 'away'
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
