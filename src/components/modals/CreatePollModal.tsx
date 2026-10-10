import React, { useState } from 'react';
import { X, BarChart2, Plus, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Poll } from '../../types/chat';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const { sendMessage, language } = useChat();
  const isFa = language === 'fa';

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowsMultiple, setAllowsMultiple] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    const pollData: Poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      isAnonymous,
      allowsMultiple,
      totalVotes: 0,
      options: validOptions.map((text, i) => ({
        id: `opt_${i + 1}`,
        text,
        votes: 0,
        votedUserIds: [],
      })),
    };

    sendMessage(question.trim(), 'poll', undefined, undefined, pollData);
    onClose();
  };

  const validOptionsCount = options.filter(o => o.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <BarChart2 className="w-5 h-5" />
            <span>{isFa ? 'ایجاد نظرسنجی جدید' : 'Create New Poll'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'سوال نظرسنجی:' : 'Poll Question:'}
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={isFa ? 'مثال: زمان مناسب برای جلسه آنلاین؟' : 'e.g. Best time for our sync?'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold mb-1">
              {isFa ? 'گزینه‌ها (حداقل ۲ گزینه):' : 'Options (at least 2):'}
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={e => handleOptionChange(i, e.target.value)}
                  placeholder={isFa ? `گزینه ${i + 1}` : `Option ${i + 1}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    className="p-2 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold mt-2 px-1"
              >
                <Plus className="w-4 h-4" />
                <span>{isFa ? 'افزودن گزینه دیگر' : 'Add another option'}</span>
              </button>
            )}
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">
                {isFa ? 'رأی‌گیری ناشناس' : 'Anonymous Voting'}
              </span>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">
                {isFa ? 'امکان انتخاب چند گزینه' : 'Allow Multiple Answers'}
              </span>
              <input
                type="checkbox"
                checked={allowsMultiple}
                onChange={e => setAllowsMultiple(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-700"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!question.trim() || validOptionsCount < 2}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold disabled:opacity-40 transition-all shadow-lg shadow-cyan-600/20"
          >
            {isFa ? 'انتشار نظرسنجی در چت' : 'Publish Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};
