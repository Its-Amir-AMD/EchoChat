import React, { useState } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { SidebarNav } from './components/sidebar/SidebarNav';
import { StoryBar } from './components/sidebar/StoryBar';
import { FolderTabs } from './components/sidebar/FolderTabs';
import { ConversationList } from './components/sidebar/ConversationList';
import { ContactsView } from './components/views/ContactsView';
import { CallsView } from './components/views/CallsView';
import { ChatHeader } from './components/chat/ChatHeader';
import { PinnedMessageBar } from './components/chat/PinnedMessageBar';
import { MessageList } from './components/chat/MessageList';
import { ReplyPreviewBar } from './components/chat/ReplyPreviewBar';
import { MessageInput } from './components/chat/MessageInput';
import { AiAssistDrawer } from './components/chat/AiAssistDrawer';
import { CallModal } from './components/modals/CallModal';
import { StoryViewerModal } from './components/modals/StoryViewerModal';
import { AddStoryModal } from './components/modals/AddStoryModal';
import { CreateGroupModal } from './components/modals/CreateGroupModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { CreatePollModal } from './components/modals/CreatePollModal';
import { ProfileSettingsModal } from './components/modals/ProfileSettingsModal';
import { ConversationInfoDrawer } from './components/modals/ConversationInfoDrawer';
import { MediaViewerModal } from './components/modals/MediaViewerModal';
import { ForwardModal } from './components/modals/ForwardModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { Story, Message, ReplyContext } from './types/chat';

function MainAppShell() {
  const {
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    messages,
    language,
  } = useChat();

  const isFa = language === 'fa';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'calls' | 'saved' | 'ai'>('chats');

  // Modals & Drawers state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isConversationInfoOpen, setIsConversationInfoOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);

  // Get active conversation pinned message if any
  const pinnedMessageId = activeConversation?.pinnedMessageIds?.[activeConversation.pinnedMessageIds.length - 1];
  const pinnedMessage = pinnedMessageId ? messages.find(m => m.id === pinnedMessageId) : undefined;

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`message-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-cyan-400', 'rounded-2xl');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-cyan-400');
      }, 1500);
    }
  };

  const handleStartChatWithUser = (userId: string) => {
    setActiveTab('chats');
    setActiveConversationId('conv_sara');
  };

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Leftmost Icon Bar (Primary Navigation) */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsProfileSettingsOpen(true)}
        onOpenProfile={() => setIsProfileSettingsOpen(true)}
      />

      {/* 2. Secondary Sidebar: Chat List / Contacts / Calls */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r rtl:border-r-0 rtl:border-l border-slate-800/80 bg-slate-900 shrink-0 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeTab === 'chats' && (
          <>
            {/* Stories reel */}
            <StoryBar
              onSelectStory={story => setSelectedStory(story)}
              onAddStoryClick={() => setIsAddStoryOpen(true)}
            />

            {/* Folder category tabs */}
            <FolderTabs />

            {/* Conversation list */}
            <ConversationList
              onCreateGroupClick={() => setIsCreateGroupOpen(true)}
              onCreateChannelClick={() => setIsCreateChannelOpen(true)}
            />
          </>
        )}

        {activeTab === 'contacts' && (
          <ContactsView onStartChat={handleStartChatWithUser} />
        )}

        {activeTab === 'calls' && (
          <CallsView />
        )}
      </div>

      {/* 3. Main Active Chat Conversation Area */}
      <main
        className={`flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Room Header */}
            <ChatHeader
              onBackClick={() => setActiveConversationId(null)}
              onOpenInfo={() => setIsConversationInfoOpen(true)}
              onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              isAiDrawerOpen={isAiDrawerOpen}
            />

            {/* Pinned Message Strip */}
            <PinnedMessageBar
              pinnedMessage={pinnedMessage}
              onScrollToMessage={scrollToMessage}
            />

            {/* Scrollable Message Bubbles */}
            <MessageList
              onReply={reply => setReplyContext(reply)}
              onEdit={msg => setEditingMessage(msg)}
              onForward={msg => setForwardingMessage(msg)}
              onOpenMedia={url => setMediaViewerUrl(url)}
            />

            {/* Quoted Reply Preview Bar */}
            <ReplyPreviewBar
              replyContext={replyContext}
              onCancel={() => setReplyContext(null)}
              isFa={isFa}
            />

            {/* Input Form Bar with Voice Recorder & Smart Replies */}
            <MessageInput
              replyContext={replyContext}
              onClearReply={() => setReplyContext(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onOpenCreatePoll={() => setIsCreatePollOpen(true)}
              onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            />
          </>
        ) : (
          /* Empty / No Conversation Selected State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 select-none">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-base font-bold text-slate-200">
              {isFa ? 'گفتگویی را برای شروع انتخاب کنید' : 'Select a conversation to start messaging'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              {isFa
                ? 'ارتباط امن، ارسال پیام صوتی، تماس‌های تصویری و دستیار هوش مصنوعی در دسترس شماست.'
                : 'Secure communications, voice notes, video calls, and AI assistance at your fingertips.'}
            </p>
          </div>
        )}
      </main>

      {/* 4. AI Assistant Drawer (Slides in on right in LTR / left in RTL) */}
      <AiAssistDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />

      {/* 5. Conversation Info Drawer */}
      <ConversationInfoDrawer
        isOpen={isConversationInfoOpen}
        onClose={() => setIsConversationInfoOpen(false)}
        onOpenMedia={url => setMediaViewerUrl(url)}
      />

      {/* 6. Floating / Modal Overlays */}
      {/* Voice & Video Call Overlay */}
      <CallModal />

      {/* Story Viewer */}
      <StoryViewerModal
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onSelectStory={story => setSelectedStory(story)}
      />

      {/* Add Story Modal */}
      <AddStoryModal
        isOpen={isAddStoryOpen}
        onClose={() => setIsAddStoryOpen(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
      />

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
      />

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />

      {/* Media Lightbox Viewer */}
      <MediaViewerModal
        url={mediaViewerUrl}
        onClose={() => setMediaViewerUrl(null)}
      />

      {/* Forward Message Modal */}
      <ForwardModal
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <MainAppShell />
    </ChatProvider>
  );
}
