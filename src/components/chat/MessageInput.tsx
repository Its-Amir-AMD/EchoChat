import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Paperclip,
  Smile,
  Image,
  BarChart2,
  FileText,
  X,
  Square,
  Sparkles
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ReplyContext, Message } from '../../types/chat';
import { requestAiAssist } from '../../services/geminiService';

interface MessageInputProps {
  replyContext: ReplyContext | null;
  onClearReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onOpenCreatePoll: () => void;
  onToggleAiDrawer: () => void;
}

const EMOJI_LIST = [
  '😀', '😂', '😍', '🔥', '👍', '❤️', '🎉', '👏',
  '🙌', '✨', '🤔', '😎', '👌', '💯', '🚀', '🙏',
  '🌹', '⚡', '☕', '🌟', '🥳', '😉', '🤝', '💪'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  replyContext,
  onClearReply,
  editingMessage,
  onCancelEdit,
  onOpenCreatePoll,
  onToggleAiDrawer,
}) => {
  const {
    sendMessage,
    editMessage,
    activeConversationId,
    drafts,
    setDraft,
    language,
    messages,
  } = useChat();

  const isFa = language === 'fa';
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore draft or editing message content
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
    } else if (activeConversationId) {
      setText(drafts[activeConversationId] || '');
    }
  }, [activeConversationId, editingMessage]);

  // Update draft on typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (!editingMessage && activeConversationId) {
      setDraft(activeConversationId, val);
    }
  };

  // Fetch smart replies when incoming message changes
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.senderId !== 'user_me' && last.type === 'text') {
        requestAiAssist({
          action: 'smart_replies',
          text: last.content,
          targetLanguage: language,
        }).then(res => {
          if (Array.isArray(res.result)) {
            setSmartReplies(res.result.slice(0, 3));
          }
        });
      } else {
        setSmartReplies([]);
      }
    }
  }, [messages.length, language]);

  // Voice recording timer
  useEffect(() => {
    let interval: number | null = null;
    if (isRecordingVoice) {
      interval = window.setInterval(() => {
        setVoiceDuration(prev => prev + 1);
      }, 1000);
    } else {
      setVoiceDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecordingVoice]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !isRecordingVoice) return;

    if (editingMessage) {
      editMessage(editingMessage.id, trimmed);
      onCancelEdit();
      setText('');
      return;
    }

    if (isRecordingVoice) {
      // Send voice message
      sendMessage('پیام صوتی (Voice Message)', 'voice', [
        {
          id: `voice_${Date.now()}`,
          type: 'audio',
          url: '',
          name: 'صدای ضبط شده',
          duration: voiceDuration,
          size: `${Math.round(voiceDuration * 12)} KB`,
        },
      ], replyContext || undefined);
      setIsRecordingVoice(false);
      onClearReply();
      return;
    }

    sendMessage(trimmed, 'text', undefined, replyContext || undefined);
    setText('');
    onClearReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      sendMessage(
        file.name,
        isImg ? 'image' : 'file',
        [
          {
            id: `att_${Date.now()}`,
            type: isImg ? 'image' : 'document',
            url: result,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
          },
        ],
        replyContext || undefined
      );
      onClearReply();
    };

    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800/80 p-3 select-none">
      {/* Smart Replies Suggestions Bar */}
      {smartReplies.length > 0 && !editingMessage && !isRecordingVoice && (
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFa ? 'پیشنهاد هوشمند:' : 'AI Suggestion:'}</span>
          </div>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => {
                sendMessage(reply, 'text', undefined, replyContext || undefined);
                setSmartReplies([]);
                onClearReply();
              }}
              className="text-xs px-3 py-1 rounded-full bg-slate-800/90 border border-cyan-500/30 text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-300 transition-all shrink-0 active:scale-95 shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Editing Message Header */}
      {editingMessage && (
        <div className="flex items-center justify-between text-xs text-amber-400 mb-2 px-1">
          <span>{isFa ? 'در حال ویرایش پیام...' : 'Editing message...'}</span>
          <button
            onClick={() => {
              onCancelEdit();
              setText('');
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-colors">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Attachment Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title={isFa ? 'پیوست فایل' : 'Attach file'}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAttachMenu(false)} />
              <div className="absolute bottom-11 right-0 rtl:right-auto rtl:left-0 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 text-xs flex flex-col gap-1">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-right rtl:text-right"
                >
                  <Image className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'تصویر یا ویدیو' : 'Photo / Video'}</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-right rtl:text-right"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'سند و فایل' : 'Document / File'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    onOpenCreatePoll();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-right rtl:text-right"
                >
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'ایجاد نظرسنجی' : 'Create Poll'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Emoji Picker Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title={isFa ? 'ایموجی' : 'Emoji'}
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Emoji Popover */}
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
              <div className="absolute bottom-11 left-0 rtl:left-auto rtl:right-0 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-40 w-64 grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 text-lg hover:scale-125 transition-transform flex items-center justify-center rounded-lg hover:bg-slate-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recording Voice Status OR Text Input Area */}
        {isRecordingVoice ? (
          <div className="flex-1 flex items-center gap-3 py-2 px-2 text-rose-400 font-medium text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>
              {isFa ? 'در حال ضبط صدا...' : 'Recording audio...'} ({Math.floor(voiceDuration / 60)}:
              {String(voiceDuration % 60).padStart(2, '0')})
            </span>
            <button
              onClick={() => setIsRecordingVoice(false)}
              className="text-slate-400 hover:text-white ml-auto text-[11px] underline"
            >
              {isFa ? 'لغو' : 'Cancel'}
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isFa ? 'پیامی بنویسید...' : 'Type a message...'}
            className="flex-1 bg-transparent border-0 resize-none max-h-32 py-2 px-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 leading-relaxed"
          />
        )}

        {/* AI Action Icon */}
        <button
          onClick={onToggleAiDrawer}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title={isFa ? 'دستیار هوش مصنوعی' : 'AI Assistant'}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Send OR Mic Recording Button */}
        {text.trim() || editingMessage ? (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95 shadow-md shadow-cyan-500/20"
            title={isFa ? 'ارسال' : 'Send'}
          >
            <Send className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        ) : isRecordingVoice ? (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-transform active:scale-95"
            title={isFa ? 'توقف و ارسال صدا' : 'Send Voice'}
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsRecordingVoice(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title={isFa ? 'ضبط پیام صوتی' : 'Record Voice'}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
