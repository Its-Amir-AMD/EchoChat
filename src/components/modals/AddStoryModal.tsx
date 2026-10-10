import React, { useState } from 'react';
import { X, Image, Upload } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_STORY_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({ isOpen, onClose }) => {
  const { addStory, language } = useChat();
  const isFa = language === 'fa';

  const [imageUrl, setImageUrl] = useState(PRESET_STORY_IMAGES[0]);
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    addStory(imageUrl, caption.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Image className="w-5 h-5" />
            <span>{isFa ? 'افزودن استوری جدید (۲۴ ساعته)' : 'Add New Story (24h)'}</span>
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
          {/* Image Preview */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Story Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Upload className="w-8 h-8 text-slate-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-[11px] text-white font-medium drop-shadow">
                {caption || (isFa ? 'پیش‌نمایش استوری شما' : 'Your story preview')}
              </span>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              {isFa ? 'انتخاب عکس یا تصویر:' : 'Select Photo:'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_STORY_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setImageUrl(img)}
                  className={`h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    imageUrl === img ? 'border-cyan-400 scale-105' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={img} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {isFa ? 'کپشن / متن استوری (اختیاری):' : 'Caption (Optional):'}
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={isFa ? 'یک روز عالی در دفتر اکوچت...' : 'A great day at EchoChat...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            {isFa ? 'انتشار استوری' : 'Post Story'}
          </button>
        </form>
      </div>
    </div>
  );
};
