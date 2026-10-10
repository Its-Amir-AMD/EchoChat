import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Globe,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Shield,
  Smartphone,
  Save,
  Check
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { UserStatus } from '../../types/chat';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateUser,
    language,
    setLanguage,
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
  } = useChat();

  const isFa = language === 'fa';

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [status, setStatus] = useState<UserStatus>(currentUser.status);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim(),
      username: username.trim().replace(/^@/, ''),
      bio: bio.trim(),
      status,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const statusOptions: { id: UserStatus; label: string; color: string }[] = [
    { id: 'online', label: isFa ? 'آنلاین' : 'Online', color: 'bg-emerald-400' },
    { id: 'busy', label: isFa ? 'مشغول (Busy)' : 'Busy', color: 'bg-rose-500' },
    { id: 'away', label: isFa ? 'غیرحاضر (Away)' : 'Away', color: 'bg-amber-400' },
    { id: 'dnd', label: isFa ? 'مزاحم نشوید (DND)' : 'Do Not Disturb', color: 'bg-red-600' },
    { id: 'offline', label: isFa ? 'مخفی / آفلاین' : 'Offline / Invisible', color: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <UserIcon className="w-5 h-5" />
            <span>{isFa ? 'تنظیمات حساب کاربری و اکوچت' : 'Account & EchoChat Settings'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto text-xs">
          {/* User Profile Avatar & Basic Info */}
          <div className="flex items-center gap-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/40"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-100 truncate">{currentUser.name}</h3>
              <p className="text-cyan-400 font-mono text-[11px] truncate">@{currentUser.username}</p>
              <p className="text-slate-400 text-[11px] font-mono mt-0.5">{currentUser.phoneNumber}</p>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isFa ? 'نام نمایشی:' : 'Display Name:'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isFa ? 'نام کاربری (@username):' : 'Username (@handle):'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {isFa ? 'درباره من (بیوگرافی):' : 'Bio / About Me:'}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Online Status Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              {isFa ? 'وضعیت حضور:' : 'Presence Status:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statusOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    status === opt.id
                      ? 'border-cyan-500 bg-cyan-500/15 text-white font-medium'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.color} shrink-0`} />
                  <span className="truncate">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences (Theme, Language, Sounds) */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'تنظیمات ظاهری و شخصی‌سازی' : 'App Preferences'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLanguage(isFa ? 'en' : 'fa')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'زبان فارسی' : 'English'}</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase">{language}</span>
              </button>

              {/* Theme Switch */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>{theme === 'dark' ? (isFa ? 'حالت تیره' : 'Dark') : (isFa ? 'حالت روشن' : 'Light')}</span>
                </div>
              </button>

              {/* Sound Switch */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>{soundEnabled ? (isFa ? 'صداها فعال' : 'Sound On') : (isFa ? 'بی‌صدا' : 'Muted')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Active Sessions info */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-slate-200">{isFa ? 'نشست فعال این دستگاه' : 'Active Session'}</p>
                <p className="text-[10px]">EchoChat Web 2.0 • Linux / WebRTC</p>
              </div>
            </div>
            <span className="text-emerald-400 font-bold text-[10px]">{isFa ? 'امن' : 'Secure'}</span>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>{isFa ? 'تغییرات ذخیره شد!' : 'Changes Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isFa ? 'ذخیره تنظیمات' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
