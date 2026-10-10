import React, { useState, useEffect } from 'react';
import { X, Heart, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { Story } from '../../types/chat';
import { useChat } from '../../context/ChatContext';

interface StoryViewerModalProps {
  story: Story | null;
  onClose: () => void;
  onSelectStory: (story: Story) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  story,
  onClose,
  onSelectStory,
}) => {
  const { stories, likeStory, markStoryViewed, sendMessage, language } = useChat();
  const isFa = language === 'fa';

  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!story) return;

    markStoryViewed(story.id);
    setProgress(0);

    const interval = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Advance to next story if available
          const currentIndex = stories.findIndex(s => s.id === story.id);
          if (currentIndex < stories.length - 1) {
            onSelectStory(stories[currentIndex + 1]);
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story?.id]);

  if (!story) return null;

  const currentIndex = stories.findIndex(s => s.id === story.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onSelectStory(stories[currentIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      onSelectStory(stories[currentIndex + 1]);
    } else {
      onClose();
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeStory(story.id);
    setIsLiked(true);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    // Send reply to conversation if exists
    sendMessage(
      `در پاسخ به استوری: "${story.caption || 'عکس'}"\n${replyText}`,
      'text'
    );
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl select-none">
      {/* Backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container */}
      <div className="relative w-full max-w-sm h-[80vh] md:h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 border border-slate-800">
        {/* Top Progress Bars for all stories */}
        <div className="absolute top-3 inset-x-3 flex items-center gap-1.5 z-20">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header (Author + Time + Close) */}
        <div className="absolute top-7 inset-x-4 flex items-center justify-between text-white z-20">
          <div className="flex items-center gap-2.5">
            <img
              src={story.userAvatar}
              alt={story.userName}
              className="w-9 h-9 rounded-full object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="text-xs font-bold text-white drop-shadow">
                {story.userName}
              </h4>
              <span className="text-[10px] text-white/80">{story.createdAt}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Media */}
        <div className="relative flex-1 bg-black flex items-center justify-center">
          <img
            src={story.imageUrl}
            alt="Story content"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm z-20"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}

          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm z-20"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 inset-x-4 text-center z-20">
            <p className="text-sm font-semibold text-white drop-shadow-md bg-black/40 px-3 py-1.5 rounded-2xl backdrop-blur-md inline-block">
              {story.caption}
            </p>
          </div>
        )}

        {/* Footer: Reply input & Like button */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 z-20">
          <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={isFa ? 'ارسال پاسخ به استوری...' : 'Reply to story...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 rounded-full bg-cyan-500 text-slate-950 disabled:opacity-40 hover:bg-cyan-400 shrink-0"
            >
              <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </form>

          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-transform active:scale-125 flex items-center gap-1 ${
              isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-mono">{story.likesCount + (isLiked ? 1 : 0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
