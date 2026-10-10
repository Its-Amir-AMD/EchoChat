import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const CallsView: React.FC = () => {
  const { contacts, startCall, language } = useChat();
  const isFa = language === 'fa';

  // Sample realistic recent calls history
  const recentCalls = [
    {
      id: 'call_1',
      user: contacts[1], // Sara
      type: 'video' as const,
      direction: 'incoming' as const,
      status: 'completed' as const,
      time: 'امروز ۱۲:۱۰',
      duration: '04:22',
    },
    {
      id: 'call_2',
      user: contacts[2], // Reza
      type: 'voice' as const,
      direction: 'outgoing' as const,
      status: 'completed' as const,
      time: 'امروز ۱۰:۴۵',
      duration: '01:50',
    },
    {
      id: 'call_3',
      user: contacts[3], // Negin
      type: 'voice' as const,
      direction: 'missed' as const,
      status: 'missed' as const,
      time: 'دیروز ۱۸:۳۰',
      duration: 'تماس بی‌پاسخ',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-100">
          {isFa ? 'تاریخچه تماس‌ها' : 'Call History'}
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1">
        {recentCalls.map(c => (
          <div
            key={c.id}
            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={c.user.avatar}
                alt={c.user.name}
                className="w-11 h-11 rounded-2xl object-cover bg-slate-800"
                referrerPolicy="no-referrer"
              />

              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-100 truncate">{c.user.name}</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  {c.direction === 'incoming' ? (
                    <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                  ) : c.direction === 'outgoing' ? (
                    <PhoneOutgoing className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{c.time}</span>
                  <span>•</span>
                  <span>{c.duration}</span>
                </div>
              </div>
            </div>

            {/* Quick Call Action */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => startCall(c.user, c.type)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                title={c.type === 'video' ? 'تماس تصویری' : 'تماس صوتی'}
              >
                {c.type === 'video' ? <Video className="w-4 h-4 text-emerald-400" /> : <Phone className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
