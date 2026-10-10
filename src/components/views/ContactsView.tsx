import React, { useState } from 'react';
import { User, Phone, Video, MessageSquare, Search, Plus, UserPlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ContactsViewProps {
  onStartChat: (userId: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ onStartChat }) => {
  const { contacts, startCall, language } = useChat();
  const isFa = language === 'fa';
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-100">
          {isFa ? 'مخاطبین اکوچت' : 'EchoChat Contacts'} ({contacts.length})
        </h2>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isFa ? 'جستجوی نام یا نام کاربری...' : 'Search name or username...'}
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1">
        {filtered.map(contact => (
          <div
            key={contact.id}
            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-11 h-11 rounded-2xl object-cover bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                    contact.status === 'online'
                      ? 'bg-emerald-400'
                      : contact.status === 'busy'
                      ? 'bg-rose-500'
                      : contact.status === 'away'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-100 truncate">{contact.name}</h4>
                <p className="text-[11px] text-cyan-400 font-mono">@{contact.username}</p>
                {contact.bio && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{contact.bio}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onStartChat(contact.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                title={isFa ? 'ارسال پیام' : 'Send message'}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(contact, 'voice')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                title={isFa ? 'تماس صوتی' : 'Voice call'}
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(contact, 'video')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors"
                title={isFa ? 'تماس تصویری' : 'Video call'}
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
