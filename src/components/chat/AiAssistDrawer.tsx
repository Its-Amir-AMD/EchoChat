import React, { useState } from 'react';
import {
  Sparkles,
  Languages,
  FileText,
  Wand2,
  Send,
  X,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { requestAiAssist } from '../../services/geminiService';

interface AiAssistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistDrawer: React.FC<AiAssistDrawerProps> = ({ isOpen, onClose }) => {
  const { messages, language, sendMessage } = useChat();
  const isFa = language === 'fa';

  const [activeMode, setActiveMode] = useState<'summary' | 'translate' | 'rewrite' | 'chat'>('summary');
  const [inputText, setInputText] = useState('');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (mode: 'summary' | 'translate' | 'rewrite' | 'chat', extraTone?: any) => {
    setIsLoading(true);
    setAiOutput('');

    let textToSend = inputText;
    let contextList: string[] = [];

    if (mode === 'summary') {
      contextList = messages.slice(-10).map(m => `${m.senderName || 'کاربر'}: ${m.content}`);
    }

    try {
      const res = await requestAiAssist({
        action: mode === 'summary' ? 'summarize' : mode === 'translate' ? 'translate' : mode === 'rewrite' ? 'rewrite' : 'chat',
        text: textToSend,
        context: contextList,
        targetLanguage: language,
        tone: extraTone || 'formal',
      });

      if (res && res.result) {
        setAiOutput(typeof res.result === 'string' ? res.result : res.result.join('\n'));
      }
    } catch {
      setAiOutput(isFa ? 'خطا در ارتباط با هوش مصنوعی.' : 'Error contacting AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    if (!aiOutput) return;
    navigator.clipboard?.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendResultToChat = () => {
    if (!aiOutput) return;
    sendMessage(aiOutput, 'text');
    onClose();
  };

  return (
    <div className="w-80 md:w-96 bg-slate-950 border-r rtl:border-r-0 rtl:border-l border-slate-800/80 flex flex-col h-full shrink-0 select-none z-20">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>{isFa ? 'دستیار هوشمند اکوچت' : 'EchoChat AI Assistant'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 p-2 gap-1 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => {
            setActiveMode('summary');
            handleAction('summary');
          }}
          className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            activeMode === 'summary'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isFa ? 'خلاصه' : 'Summary'}</span>
        </button>

        <button
          onClick={() => setActiveMode('translate')}
          className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            activeMode === 'translate'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>{isFa ? 'ترجمه' : 'Translate'}</span>
        </button>

        <button
          onClick={() => setActiveMode('rewrite')}
          className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            activeMode === 'rewrite'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>{isFa ? 'لحن پیام' : 'Rewrite'}</span>
        </button>

        <button
          onClick={() => setActiveMode('chat')}
          className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            activeMode === 'chat'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isFa ? 'گفتگو' : 'Ask AI'}</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {activeMode === 'summary' && (
          <div className="space-y-3">
            <p className="text-slate-400">
              {isFa
                ? 'خلاصه‌سازی خودکار آخرین پیام‌های این مکالمه به زبان فارسی:'
                : 'Automatically summarize the latest messages in this chat:'}
            </p>
            <button
              onClick={() => handleAction('summary')}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isFa ? 'ایجاد خلاصه پیام‌ها' : 'Generate Chat Summary'}</span>
            </button>
          </div>
        )}

        {(activeMode === 'translate' || activeMode === 'rewrite' || activeMode === 'chat') && (
          <div className="space-y-2">
            <label className="text-slate-400 block font-medium">
              {activeMode === 'translate'
                ? isFa ? 'متن برای ترجمه:' : 'Text to translate:'
                : activeMode === 'rewrite'
                ? isFa ? 'متن پیش‌نویس شما:' : 'Your draft text:'
                : isFa ? 'سوال یا درخواست شما:' : 'Your prompt / question:'}
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isFa ? 'اینجا بنویسید...' : 'Type here...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />

            {activeMode === 'rewrite' && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAction('rewrite', 'formal')}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300"
                >
                  {isFa ? 'رسمی' : 'Formal'}
                </button>
                <button
                  onClick={() => handleAction('rewrite', 'friendly')}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300"
                >
                  {isFa ? 'دوستانه' : 'Friendly'}
                </button>
                <button
                  onClick={() => handleAction('rewrite', 'concise')}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300"
                >
                  {isFa ? 'خلاصه' : 'Concise'}
                </button>
              </div>
            )}

            {activeMode !== 'rewrite' && (
              <button
                onClick={() => handleAction(activeMode)}
                disabled={isLoading || !inputText.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {activeMode === 'translate'
                    ? isFa ? 'ترجمه کن' : 'Translate'
                    : isFa ? 'ارسال به هوش مصنوعی' : 'Ask AI'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* AI Result Box */}
        {(isLoading || aiOutput) && (
          <div className="mt-4 p-3.5 bg-slate-900/90 border border-cyan-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>{isFa ? 'نتیجه دستیار:' : 'AI Output:'}</span>
              {aiOutput && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyResult}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title={isFa ? 'کپی متن' : 'Copy'}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={sendResultToChat}
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300"
                    title={isFa ? 'ارسال به چت' : 'Send to chat'}
                  >
                    <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{isFa ? 'در حال پردازش هوشمند...' : 'Thinking...'}</span>
              </div>
            ) : (
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {aiOutput}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
