import React, { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { contacts, createGroup, language } = useChat();
  const isFa = language === 'fa';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedUserIds.length === 0) return;

    createGroup(title.trim(), description.trim(), selectedUserIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Users className="w-5 h-5" />
            <span>{isFa ? 'ایجاد گروه جدید' : 'Create New Group'}</span>
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
              {isFa ? 'نام گروه:' : 'Group Name:'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isFa ? 'مثال: تیم توسعه محصول' : 'e.g. Product Engineering'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'توضیحات (اختیاری):' : 'Description (Optional):'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isFa ? 'موضوع و قوانین گروه...' : 'Topic and group rules...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              {isFa ? 'انتخاب اعضا:' : 'Select Members:'} ({selectedUserIds.length})
            </label>
            <div className="max-h-44 overflow-y-auto space-y-1.5 p-1 bg-slate-950/60 border border-slate-800 rounded-xl">
              {contacts.map(c => {
                const isSelected = selectedUserIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleUser(c.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-7 h-7 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-medium truncate">{c.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || selectedUserIds.length === 0}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold disabled:opacity-40 transition-all shadow-lg shadow-cyan-600/20"
          >
            {isFa ? 'ایجاد گروه' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};
