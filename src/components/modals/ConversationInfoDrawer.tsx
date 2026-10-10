import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Image,
  FileText,
  Mic,
  Users,
  Shield,
  Trash2,
  Share2,
  ExternalLink
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ConversationInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMedia: (url: string) => void;
}

export const ConversationInfoDrawer: React.FC<ConversationInfoDrawerProps> = ({
  isOpen,
  onClose,
  onOpenMedia,
}) => {
  const {
    activeConversation,
    messages,
    contacts,
    startCall,
    toggleMuteConversation,
    clearConversationHistory,
    language,
  } = useChat();

  const isFa = language === 'fa';
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'docs' | 'audio' | 'members'>('media');

  if (!isOpen || !activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const isDirect = activeConversation.type === 'direct';

  const targetUser = contacts.find(c => activeConversation.participantIds.includes(c.id)) || {
    id: activeConversation.id,
    name: activeConversation.title,
    username: activeConversation.username || '',
    avatar: activeConversation.avatar,
    status: 'online',
  };

  // Collect shared media from messages
  const allAttachments = messages.flatMap(m => m.attachments || []);
  const mediaList = allAttachments.filter(a => a.type === 'image' || a.type === 'video');
  const docList = allAttachments.filter(a => a.type === 'document');
  const audioList = messages.filter(m => m.type === 'voice');

  return (
    <div className="w-80 md:w-96 bg-slate-950 border-r rtl:border-r-0 rtl:border-l border-slate-800/80 flex flex-col h-full shrink-0 select-none z-20">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-100">
          {isFa ? 'اطلاعات گفتگو' : 'Chat Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <img
            src={activeConversation.avatar}
            alt={activeConversation.title}
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-slate-800 shadow-xl mb-3"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-base font-bold text-slate-100">{activeConversation.title}</h2>
          {activeConversation.username && (
            <p className="text-cyan-400 font-mono text-[11px] mt-0.5">
              @{activeConversation.username}
            </p>
          )}
          {activeConversation.description && (
            <p className="text-slate-400 mt-2 text-xs leading-relaxed max-w-xs">
              {activeConversation.description}
            </p>
          )}

          {/* Quick Call Actions for Direct */}
          {isDirect && activeConversation.id !== 'conv_saved' && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => startCall(targetUser, 'voice')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'صوتی' : 'Voice'}</span>
              </button>
              <button
                onClick={() => startCall(targetUser, 'video')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isFa ? 'تصویری' : 'Video'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Toggles */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <button
            onClick={() => toggleMuteConversation(activeConversation.id)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-slate-300"
          >
            <div className="flex items-center gap-2.5">
              {activeConversation.isMuted ? (
                <BellOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Bell className="w-4 h-4 text-cyan-400" />
              )}
              <span>{isFa ? 'اعلان‌ها' : 'Notifications'}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {activeConversation.isMuted ? (isFa ? 'بی‌صدا' : 'Muted') : (isFa ? 'فعال' : 'Enabled')}
            </span>
          </button>
        </div>

        {/* Shared Media Tabs */}
        <div>
          <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-[11px] font-semibold text-slate-400">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={`flex-1 py-1 text-center rounded-lg ${
                activeMediaTab === 'media' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'hover:text-white'
              }`}
            >
              {isFa ? 'رسانه' : 'Media'} ({mediaList.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('docs')}
              className={`flex-1 py-1 text-center rounded-lg ${
                activeMediaTab === 'docs' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'hover:text-white'
              }`}
            >
              {isFa ? 'فایل‌ها' : 'Files'} ({docList.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('audio')}
              className={`flex-1 py-1 text-center rounded-lg ${
                activeMediaTab === 'audio' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'hover:text-white'
              }`}
            >
              {isFa ? 'صوت' : 'Audio'} ({audioList.length})
            </button>
            {isGroup && (
              <button
                onClick={() => setActiveMediaTab('members')}
                className={`flex-1 py-1 text-center rounded-lg ${
                  activeMediaTab === 'members' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'hover:text-white'
                }`}
              >
                {isFa ? 'اعضا' : 'Members'} ({activeConversation.participantIds.length})
              </button>
            )}
          </div>

          <div className="pt-3">
            {/* Media Gallery Grid */}
            {activeMediaTab === 'media' && (
              <div className="grid grid-cols-3 gap-1.5">
                {mediaList.length === 0 ? (
                  <p className="col-span-3 text-center text-slate-500 py-6">
                    {isFa ? 'رسانه‌ای یافت نشد.' : 'No shared media.'}
                  </p>
                ) : (
                  mediaList.map(m => (
                    <div
                      key={m.id}
                      onClick={() => onOpenMedia(m.url)}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 border border-slate-800"
                    >
                      <img
                        src={m.url}
                        alt="Shared"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Documents List */}
            {activeMediaTab === 'docs' && (
              <div className="space-y-2">
                {docList.length === 0 ? (
                  <p className="text-center text-slate-500 py-6">
                    {isFa ? 'فایلی یافت نشد.' : 'No shared files.'}
                  </p>
                ) : (
                  docList.map(d => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl"
                    >
                      <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{d.name}</p>
                        <span className="text-[10px] text-slate-500">{d.size}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Audio Voice Notes List */}
            {activeMediaTab === 'audio' && (
              <div className="space-y-2">
                {audioList.length === 0 ? (
                  <p className="text-center text-slate-500 py-6">
                    {isFa ? 'پیام صوتی وجود ندارد.' : 'No voice notes.'}
                  </p>
                ) : (
                  audioList.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 p-2 bg-slate-900 rounded-xl"
                    >
                      <Mic className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.senderName || 'پیام صوتی'}</p>
                        <span className="text-[10px] text-slate-500">{a.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Group Members List */}
            {activeMediaTab === 'members' && isGroup && (
              <div className="space-y-2">
                {activeConversation.members?.map(m => {
                  const user = contacts.find(c => c.id === m.userId) || {
                    id: m.userId,
                    name: m.userId === 'user_me' ? (isFa ? 'شما' : 'You') : 'کاربر',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  };
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-medium text-slate-200 truncate">{user.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-semibold text-cyan-400">
                        {m.role === 'owner' ? (isFa ? 'مالک' : 'Owner') : m.role === 'admin' ? (isFa ? 'مدیر' : 'Admin') : (isFa ? 'عضو' : 'Member')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Danger zone: Clear Chat */}
        <div className="pt-2">
          <button
            onClick={() => {
              clearConversationHistory(activeConversation.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isFa ? 'پاک کردن تاریخچه پیام‌ها' : 'Clear Chat History'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
