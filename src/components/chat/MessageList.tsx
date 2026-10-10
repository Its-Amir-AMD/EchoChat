import React, { useRef, useEffect, useState } from 'react';
import {
  Check,
  CheckCheck,
  Reply,
  Copy,
  Trash2,
  Edit2,
  Pin,
  Share2,
  Smile,
  Play,
  Pause,
  PhoneCall,
  Video,
  FileText,
  Download
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Message, ReplyContext } from '../../types/chat';

interface MessageListProps {
  onReply: (reply: ReplyContext) => void;
  onEdit: (message: Message) => void;
  onForward: (message: Message) => void;
  onOpenMedia: (url: string) => void;
}

const COMMON_EMOJIS = ['❤️', '👍', '😂', '🔥', '🎉', '👏', '😮', '⚡'];

export const MessageList: React.FC<MessageListProps> = ({
  onReply,
  onEdit,
  onForward,
  onOpenMedia,
}) => {
  const {
    messages,
    currentUser,
    activeConversation,
    deleteMessage,
    addReaction,
    votePoll,
    pinMessage,
    unpinMessage,
    language,
  } = useChat();

  const isFa = language === 'fa';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const toggleVoicePlayback = (id: string) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
      // Auto pause after 6 seconds simulation
      setTimeout(() => {
        setPlayingVoiceId(prev => prev === id ? null : prev);
      }, 6000);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3.5 chat-bg-pattern dark:chat-bg-pattern-dark select-text"
    >
      {/* Welcome / Encryption Banner */}
      <div className="flex justify-center my-2">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-1.5 text-[11px] text-slate-400 text-center max-w-sm backdrop-blur-sm select-none">
          🔒 {isFa ? 'پیام‌ها با پروتکل امن و رمزنگاری بلادرنگ محافظت می‌شوند.' : 'Messages are protected with real-time end-to-end security.'}
        </div>
      </div>

      {messages.map((msg, index) => {
        const isMe = msg.senderId === currentUser.id;
        const isGroup = activeConversation?.type === 'group';
        const isVoice = msg.type === 'voice';
        const isPoll = msg.type === 'poll' && msg.poll;
        const isCallLog = msg.type === 'call_log';
        const hasAttachments = msg.attachments && msg.attachments.length > 0;

        return (
          <div
            key={msg.id}
            id={`message-${msg.id}`}
            className={`group relative flex flex-col ${
              isMe ? 'items-end' : 'items-start'
            } transition-all`}
          >
            {/* Sender name in group conversations */}
            {isGroup && !isMe && (
              <span className="text-[11px] font-semibold text-cyan-400 mb-1 px-1">
                {msg.senderName || 'عضو گروه'}
              </span>
            )}

            {/* Main Message Bubble */}
            <div
              className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-sm transition-all text-xs leading-relaxed ${
                isMe
                  ? 'bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-br-sm'
                  : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-sm'
              }`}
            >
              {/* Forwarded Header */}
              {msg.forwardedFrom && (
                <div className="text-[10px] opacity-80 mb-1 italic flex items-center gap-1">
                  <Share2 className="w-2.5 h-2.5" />
                  <span>
                    {isFa ? `هدایت‌شده از: ${msg.forwardedFrom}` : `Forwarded from: ${msg.forwardedFrom}`}
                  </span>
                </div>
              )}

              {/* Reply Quote Preview */}
              {msg.replyTo && (
                <div
                  className={`mb-2 p-2 rounded-lg border-l-2 rtl:border-l-0 rtl:border-r-2 text-[11px] cursor-pointer ${
                    isMe
                      ? 'bg-black/15 border-cyan-200 text-cyan-50'
                      : 'bg-slate-900/60 border-cyan-400 text-slate-300'
                  }`}
                  onClick={() => {
                    const el = document.getElementById(`message-${msg.replyTo?.messageId}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <span className="font-bold block truncate text-cyan-300">
                    {msg.replyTo.senderName}
                  </span>
                  <p className="truncate opacity-90">{msg.replyTo.content}</p>
                </div>
              )}

              {/* Media Attachments */}
              {hasAttachments && (
                <div className="space-y-2 mb-2">
                  {msg.attachments!.map(att => {
                    if (att.type === 'image') {
                      return (
                        <div
                          key={att.id}
                          className="rounded-xl overflow-hidden cursor-pointer max-w-sm hover:opacity-95 transition-opacity"
                          onClick={() => onOpenMedia(att.url)}
                        >
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full max-h-64 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-2.5 p-2 bg-slate-950/40 rounded-xl"
                      >
                        <FileText className="w-6 h-6 text-cyan-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{att.name}</p>
                          <span className="text-[10px] opacity-70">{att.size}</span>
                        </div>
                        <a
                          href={att.url || '#'}
                          download={att.name}
                          className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Call Log Message */}
              {isCallLog && (
                <div className="flex items-center gap-2 py-1">
                  <PhoneCall className="w-4 h-4 text-emerald-300" />
                  <span className="font-medium">{msg.content}</span>
                </div>
              )}

              {/* Voice Message Waveform Player */}
              {isVoice && (
                <div className="flex items-center gap-3 py-1 min-w-[200px]">
                  <button
                    onClick={() => toggleVoicePlayback(msg.id)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0 transition-transform active:scale-95"
                  >
                    {playingVoiceId === msg.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 translate-x-0.5 rtl:-translate-x-0.5" />
                    )}
                  </button>
                  <div className="flex-1 flex items-center gap-1 h-6">
                    {/* Simulated interactive audio waveform */}
                    {[12, 24, 18, 30, 16, 28, 20, 32, 14, 22, 18, 26, 12, 20, 16].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          playingVoiceId === msg.id ? 'bg-white animate-pulse-wave' : 'bg-white/50'
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono opacity-80 shrink-0">0:18</span>
                </div>
              )}

              {/* Interactive Poll Card */}
              {isPoll && (
                <div className="space-y-2 py-1 min-w-[240px]">
                  <h4 className="font-bold text-sm text-slate-100">{msg.poll!.question}</h4>
                  <div className="space-y-1.5">
                    {msg.poll!.options.map(opt => {
                      const hasVoted = opt.votedUserIds.includes(currentUser.id);
                      const percent =
                        msg.poll!.totalVotes > 0
                          ? Math.round((opt.votes / msg.poll!.totalVotes) * 100)
                          : 0;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => votePoll(msg.id, opt.id)}
                          className={`w-full relative p-2.5 rounded-xl border text-right rtl:text-right overflow-hidden transition-all text-xs flex items-center justify-between ${
                            hasVoted
                              ? 'border-cyan-400 bg-cyan-500/20 text-white font-medium'
                              : 'border-slate-700/60 bg-slate-900/50 hover:bg-slate-900/80 text-slate-200'
                          }`}
                        >
                          {/* Progress fill bar */}
                          <div
                            className="absolute top-0 bottom-0 left-0 right-auto rtl:left-auto rtl:right-0 bg-cyan-500/25 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                          <span className="relative z-10 flex-1 truncate">{opt.text}</span>
                          <span className="relative z-10 font-mono text-[11px] opacity-80 ml-2 rtl:ml-0 rtl:mr-2">
                            {percent}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>
                      {isFa
                        ? `${msg.poll!.totalVotes.toLocaleString('fa-IR')} رأی`
                        : `${msg.poll!.totalVotes} votes`}
                    </span>
                    <span>
                      {msg.poll!.isAnonymous
                        ? (isFa ? 'نظرسنجی ناشناس' : 'Anonymous poll')
                        : (isFa ? 'نظرسنجی عمومی' : 'Public poll')}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Message Content */}
              {!isVoice && !isPoll && !isCallLog && (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}

              {/* Message Footer: Timestamp, Edited tag, Read Receipts */}
              <div
                className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
                  isMe ? 'text-cyan-100/80' : 'text-slate-400'
                }`}
              >
                {msg.isEdited && (
                  <span className="italic">{isFa ? '(ویرایش‌شده)' : '(edited)'}</span>
                )}
                <span className="font-mono">{msg.timestamp}</span>
                {isMe && (
                  <span>
                    {msg.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                    ) : msg.status === 'delivered' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white/70" />
                    )}
                  </span>
                )}
              </div>

              {/* Emoji Reactions Bar */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-2 select-none">
                  {msg.reactions.map((r, i) => {
                    const hasReacted = r.userIds.includes(currentUser.id);
                    return (
                      <button
                        key={i}
                        onClick={() => addReaction(msg.id, r.emoji)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                          hasReacted
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-mono text-[10px]">{r.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action Buttons on Message Hover */}
            <div
              className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1 py-0.5 bg-slate-950/80 border border-slate-800 rounded-lg shadow-lg mt-1 select-none backdrop-blur-sm z-10 ${
                isMe ? 'self-end' : 'self-start'
              }`}
            >
              {/* React button */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveReactionPickerId(activeReactionPickerId === msg.id ? null : msg.id)
                  }
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                  title={isFa ? 'واکنش' : 'React'}
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>

                {/* Popover Emoji Picker */}
                {activeReactionPickerId === msg.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveReactionPickerId(null)}
                    />
                    <div className="absolute bottom-7 left-0 rtl:left-auto rtl:right-0 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl flex items-center gap-1 z-50">
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            addReaction(msg.id, emoji);
                            setActiveReactionPickerId(null);
                          }}
                          className="hover:scale-125 transition-transform p-1 text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Reply */}
              <button
                onClick={() =>
                  onReply({
                    messageId: msg.id,
                    senderName: msg.senderName || currentUser.name,
                    content: msg.content,
                    type: msg.type,
                  })
                }
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                title={isFa ? 'پاسخ' : 'Reply'}
              >
                <Reply className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </button>

              {/* Copy */}
              <button
                onClick={() => copyText(msg.content)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title={isFa ? 'کپی' : 'Copy'}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Forward */}
              <button
                onClick={() => onForward(msg)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title={isFa ? 'هدایت پیام' : 'Forward'}
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {/* Pin */}
              <button
                onClick={() => (msg.isPinned ? unpinMessage(msg.id) : pinMessage(msg.id))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                title={msg.isPinned ? (isFa ? 'برداشتن سنجاق' : 'Unpin') : (isFa ? 'سنجاق کردن' : 'Pin')}
              >
                <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'text-cyan-400' : ''}`} />
              </button>

              {/* Edit (only if user sent and it's text) */}
              {isMe && msg.type === 'text' && (
                <button
                  onClick={() => onEdit(msg)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                  title={isFa ? 'ویرایش' : 'Edit'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete */}
              {isMe && (
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                  title={isFa ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
