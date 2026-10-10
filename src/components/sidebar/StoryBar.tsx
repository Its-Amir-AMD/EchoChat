import React from 'react';
import { Plus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Story } from '../../types/chat';

interface StoryBarProps {
  onSelectStory: (story: Story) => void;
  onAddStoryClick: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({ onSelectStory, onAddStoryClick }) => {
  const { currentUser, stories, language } = useChat();
  const isFa = language === 'fa';

  return (
    <div className="w-full px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto scrollbar-none flex items-center gap-3.5 select-none">
      {/* Add Story Button for Current User */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={onAddStoryClick}>
        <div className="relative w-14 h-14 rounded-full p-0.5 bg-slate-800 ring-2 ring-slate-700/60 group-hover:ring-cyan-500/80 transition-all">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
        <span className="text-[11px] text-slate-400 group-hover:text-cyan-400 font-medium max-w-[58px] truncate text-center">
          {isFa ? 'استوری من' : 'My Story'}
        </span>
      </div>

      {/* Stories from contacts */}
      {stories.map(story => (
        <div
          key={story.id}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          onClick={() => onSelectStory(story)}
        >
          <div
            className={`w-14 h-14 rounded-full p-[2.5px] transition-all transform group-hover:scale-105 ${
              story.isViewed
                ? 'bg-slate-700 ring-1 ring-slate-800'
                : 'bg-gradient-to-tr from-cyan-400 via-emerald-400 to-indigo-500 shadow-md shadow-cyan-500/10'
            }`}
          >
            <div className="w-full h-full rounded-full p-0.5 bg-slate-900">
              <img
                src={story.userAvatar}
                alt={story.userName}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-300 group-hover:text-white font-medium max-w-[58px] truncate text-center">
            {story.userName.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};
