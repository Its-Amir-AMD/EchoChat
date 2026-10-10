import React, { useState } from 'react';
import { X, Radio } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const { createChannel, language } = useChat();
  const isFa = language === 'fa';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createChannel(
      title.trim(),
      description.trim(),
      username.trim().replace(/^@/, '') || `channel_${Date.now()}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Radio className="w-5 h-5" />
            <span>{isFa ? 'ایجاد کانال اطلاع‌رسانی جدید' : 'Create New Channel'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'نام کانال:' : 'Channel Name:'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isFa ? 'مثال: اخبار اکوچت' : 'e.g. Tech Announcements'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'شناسه عمومی (@username):' : 'Public Handle (@username):'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-500">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="my_channel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3.5 rtl:pl-3.5 rtl:pr-8 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'توضیحات کانال:' : 'Description:'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isFa ? 'درباره این کانال بنویسید...' : 'What is this channel about...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold disabled:opacity-40 transition-all shadow-lg shadow-indigo-600/20"
          >
            {isFa ? 'ایجاد کانال' : 'Create Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};
