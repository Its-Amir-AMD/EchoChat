import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Conversation,
  Message,
  Story,
  CallSession,
  FolderCategory,
  MessageType,
  Attachment,
  ReplyContext,
  Poll,
  UserStatus,
  CallType
} from '../types/chat';
import {
  CURRENT_USER,
  CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_STORIES
} from '../data/initialData';
import { soundEffects } from '../services/soundEffects';
import { requestAiAssist } from '../services/geminiService';

interface ChatContextType {
  currentUser: User;
  updateUser: (updated: Partial<User>) => void;
  contacts: User[];
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  setActiveConversationId: (id: string | null) => void;
  activeFolder: FolderCategory;
  setActiveFolder: (folder: FolderCategory) => void;
  messages: Message[];
  allMessages: Record<string, Message[]>;
  sendMessage: (
    content: string,
    type?: MessageType,
    attachments?: Attachment[],
    replyTo?: ReplyContext,
    poll?: Poll
  ) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string, forEveryone?: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
  votePoll: (messageId: string, optionId: string) => void;
  pinMessage: (messageId: string) => void;
  unpinMessage: (messageId: string) => void;
  forwardMessage: (messageId: string, targetConversationId: string) => void;
  clearConversationHistory: (conversationId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  toggleArchiveConversation: (conversationId: string) => void;
  createGroup: (title: string, description: string, participantIds: string[]) => string;
  createChannel: (title: string, description: string, username: string) => string;
  
  // Stories
  stories: Story[];
  addStory: (imageUrl: string, caption?: string) => void;
  likeStory: (storyId: string) => void;
  markStoryViewed: (storyId: string) => void;

  // Calls
  currentCall: CallSession | null;
  startCall: (targetUser: User, type: CallType) => void;
  acceptCall: () => void;
  endCall: () => void;
  toggleCallMute: () => void;
  toggleCallVideo: () => void;
  toggleCallScreenShare: () => void;

  // Global settings
  language: 'fa' | 'en';
  setLanguage: (lang: 'fa' | 'en') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Drafts & Typing
  drafts: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  typingUsers: string[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'echochat_v2_';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from localStorage with fallbacks
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}convs`);
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}msgs`);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}stories`);
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv_ai');
  const [activeFolder, setActiveFolder] = useState<FolderCategory>('all');
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const [language, setLanguage] = useState<'fa' | 'en'>(() => {
    return (localStorage.getItem(`${STORAGE_KEY_PREFIX}lang`) as 'fa' | 'en') || 'fa';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`) as 'dark' | 'light') || 'dark';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sound`);
    return saved ? JSON.parse(saved) : true;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}convs`, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}msgs`, JSON.stringify(allMessages));
  }, [allMessages]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}stories`, JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}lang`, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundEffects.setEnabled(enabled);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sound`, JSON.stringify(enabled));
  };

  // Call timer interval
  useEffect(() => {
    let timer: number | null = null;
    if (currentCall && currentCall.status === 'connected') {
      timer = window.setInterval(() => {
        setCurrentCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentCall?.status]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const messages = activeConversationId ? allMessages[activeConversationId] || [] : [];

  const updateUser = (updated: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
  };

  const setDraft = (conversationId: string, text: string) => {
    setDrafts(prev => ({ ...prev, [conversationId]: text }));
  };

  const sendMessage = (
    content: string,
    type: MessageType = 'text',
    attachments?: Attachment[],
    replyTo?: ReplyContext,
    poll?: Poll
  ) => {
    if (!activeConversationId) return;

    const convId = activeConversationId;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId: convId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      type,
      content,
      timestamp: timeStr,
      status: 'delivered',
      attachments,
      replyTo,
      poll,
      reactions: [],
    };

    soundEffects.playMessageSent();

    setAllMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    // Update conversation last message & timestamp
    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            updatedAt: timeStr,
            lastMessage: {
              id: newMsg.id,
              senderId: currentUser.id,
              senderName: currentUser.name,
              content: type === 'poll' ? (poll?.question || 'نظرسنجی') : content,
              timestamp: timeStr,
              type,
              status: 'delivered',
            },
          };
        }
        return c;
      })
    );

    // Clear draft
    setDraft(convId, '');

    // Bot / Echo AI / Contact automated intelligent reply
    const targetConv = conversations.find(c => c.id === convId);
    if (targetConv && (targetConv.type === 'bot' || targetConv.id === 'conv_ai')) {
      // Simulate typing indicator
      setTypingUsers([targetConv.title]);
      setTimeout(async () => {
        setTypingUsers([]);
        
        // Request assistant response
        const aiRes = await requestAiAssist({
          action: 'chat',
          text: content,
          targetLanguage: language,
        });

        const replyContent = typeof aiRes.result === 'string' ? aiRes.result : aiRes.result.join('\n');
        const replyTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

        const botMsg: Message = {
          id: `msg_bot_${Date.now()}`,
          conversationId: convId,
          senderId: 'user_ai',
          senderName: targetConv.title,
          senderAvatar: targetConv.avatar,
          type: 'text',
          content: replyContent,
          timestamp: replyTime,
          status: 'read',
          reactions: [],
        };

        soundEffects.playMessageReceived();

        setAllMessages(prev => ({
          ...prev,
          [convId]: [...(prev[convId] || []), botMsg],
        }));

        setConversations(prev =>
          prev.map(c =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: replyTime,
                  lastMessage: {
                    id: botMsg.id,
                    senderId: 'user_ai',
                    senderName: targetConv.title,
                    content: replyContent,
                    timestamp: replyTime,
                    type: 'text',
                    status: 'read',
                  },
                }
              : c
          )
        );
      }, 1200);
    } else if (targetConv && targetConv.type === 'direct' && targetConv.id !== 'conv_saved') {
      // Periodic natural simulated response if user chats with contacts
      if (Math.random() > 0.4) {
        setTimeout(() => {
          setTypingUsers([targetConv.title]);
          setTimeout(() => {
            setTypingUsers([]);
            const repliesFa = [
              'عالیه، پیام شما دریافت شد! بررسی می‌کنم.',
              'ممنون از ارسالت، کاملاً موافقم 👍',
              'بسیار خوب، اگر نیاز به هماهنگی بیشتر بود تماس می‌گیرم.',
              'دریافت شد، ممنون از پیگیریت عزیز ✨',
            ];
            const repliesEn = [
              'Awesome, message received! Reviewing now.',
              'Thanks for sending, totally agree 👍',
              'Sounds good, let me know if anything else is needed.',
              'Got it, thanks for the update! ✨',
            ];
            const pool = language === 'fa' ? repliesFa : repliesEn;
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            const rTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

            const autoMsg: Message = {
              id: `msg_contact_${Date.now()}`,
              conversationId: convId,
              senderId: targetConv.participantIds.find(id => id !== currentUser.id) || 'contact',
              senderName: targetConv.title,
              senderAvatar: targetConv.avatar,
              type: 'text',
              content: chosen,
              timestamp: rTime,
              status: 'delivered',
              reactions: [],
            };

            soundEffects.playMessageReceived();

            setAllMessages(prev => ({
              ...prev,
              [convId]: [...(prev[convId] || []), autoMsg],
            }));

            setConversations(prev =>
              prev.map(c =>
                c.id === convId
                  ? {
                      ...c,
                      updatedAt: rTime,
                      lastMessage: {
                        id: autoMsg.id,
                        senderId: autoMsg.senderId,
                        senderName: targetConv.title,
                        content: chosen,
                        timestamp: rTime,
                        type: 'text',
                        status: 'delivered',
                      },
                    }
                  : c
              )
            );
          }, 1500);
        }, 1000);
      }
    }
  };

  const editMessage = (messageId: string, newContent: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            content: newContent,
            isEdited: true,
            editedAt: `${new Date().getHours()}:${new Date().getMinutes()}`,
          };
        }
        return m;
      }),
    }));
  };

  const deleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).filter(m => m.id !== messageId),
    }));
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m => {
        if (m.id === messageId) {
          const existing = m.reactions.find(r => r.emoji === emoji);
          let updatedReactions = [...m.reactions];
          if (existing) {
            if (existing.userIds.includes(currentUser.id)) {
              // remove reaction
              updatedReactions = updatedReactions
                .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== currentUser.id) } : r)
                .filter(r => r.count > 0);
            } else {
              // add user
              updatedReactions = updatedReactions.map(r =>
                r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUser.id] } : r
              );
            }
          } else {
            updatedReactions.push({ emoji, count: 1, userIds: [currentUser.id] });
          }
          return { ...m, reactions: updatedReactions };
        }
        return m;
      }),
    }));
  };

  const votePoll = (messageId: string, optionId: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m => {
        if (m.id === messageId && m.poll) {
          const poll = m.poll;
          const userAlreadyVoted = poll.options.some(opt => opt.votedUserIds.includes(currentUser.id));
          
          const newOptions = poll.options.map(opt => {
            if (opt.id === optionId) {
              const hasVotedThis = opt.votedUserIds.includes(currentUser.id);
              if (hasVotedThis) {
                return {
                  ...opt,
                  votes: Math.max(0, opt.votes - 1),
                  votedUserIds: opt.votedUserIds.filter(id => id !== currentUser.id),
                };
              } else {
                return {
                  ...opt,
                  votes: opt.votes + 1,
                  votedUserIds: [...opt.votedUserIds, currentUser.id],
                };
              }
            } else if (!poll.allowsMultiple && userAlreadyVoted) {
              // Remove vote from previous option if single choice
              return {
                ...opt,
                votes: opt.votedUserIds.includes(currentUser.id) ? Math.max(0, opt.votes - 1) : opt.votes,
                votedUserIds: opt.votedUserIds.filter(id => id !== currentUser.id),
              };
            }
            return opt;
          });

          const total = newOptions.reduce((acc, o) => acc + o.votes, 0);

          return {
            ...m,
            poll: {
              ...poll,
              options: newOptions,
              totalVotes: total,
            },
          };
        }
        return m;
      }),
    }));
  };

  const pinMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m =>
        m.id === messageId ? { ...m, isPinned: true } : m
      ),
    }));
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversationId
          ? { ...c, pinnedMessageIds: [...(c.pinnedMessageIds || []), messageId] }
          : c
      )
    );
  };

  const unpinMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m =>
        m.id === messageId ? { ...m, isPinned: false } : m
      ),
    }));
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversationId
          ? { ...c, pinnedMessageIds: (c.pinnedMessageIds || []).filter(id => id !== messageId) }
          : c
      )
    );
  };

  const forwardMessage = (messageId: string, targetConversationId: string) => {
    const sourceMsg = messages.find(m => m.id === messageId);
    if (!sourceMsg) return;

    const forwardedMsg: Message = {
      ...sourceMsg,
      id: `msg_fwd_${Date.now()}`,
      conversationId: targetConversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      forwardedFrom: sourceMsg.senderName || 'کاربر اکوچت',
      timestamp: `${new Date().getHours()}:${new Date().getMinutes()}`,
      reactions: [],
    };

    setAllMessages(prev => ({
      ...prev,
      [targetConversationId]: [...(prev[targetConversationId] || []), forwardedMsg],
    }));

    soundEffects.playMessageSent();
  };

  const clearConversationHistory = (conversationId: string) => {
    setAllMessages(prev => ({
      ...prev,
      [conversationId]: [],
    }));
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c)
    );
  };

  const togglePinConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c)
    );
  };

  const toggleMuteConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c)
    );
  };

  const toggleArchiveConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c)
    );
  };

  const createGroup = (title: string, description: string, participantIds: string[]): string => {
    const newId = `group_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      type: 'group',
      title,
      description,
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      updatedAt: 'همین الان',
      participantIds: [currentUser.id, ...participantIds],
      members: [
        { userId: currentUser.id, role: 'owner', joinedAt: new Date().toISOString() },
        ...participantIds.map(id => ({ userId: id, role: 'member' as const, joinedAt: new Date().toISOString() })),
      ],
      lastMessage: {
        id: `msg_init_${newId}`,
        senderId: currentUser.id,
        content: `گروه «${title}» توسط ${currentUser.name} ایجاد شد.`,
        timestamp: 'الان',
        type: 'text',
      },
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    return newId;
  };

  const createChannel = (title: string, description: string, username: string): string => {
    const newId = `channel_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      type: 'channel',
      title,
      description,
      username,
      avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&auto=format&fit=crop&q=80',
      subscribersCount: 1,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      updatedAt: 'همین الان',
      participantIds: [currentUser.id],
      lastMessage: {
        id: `msg_init_${newId}`,
        senderId: currentUser.id,
        content: `کانال «${title}» راه‌اندازی شد.`,
        timestamp: 'الان',
        type: 'text',
      },
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    return newId;
  };

  // Stories
  const addStory = (imageUrl: string, caption?: string) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      imageUrl,
      caption,
      createdAt: 'لحظاتی پیش',
      expiresAt: '۲۴ ساعت دیگر',
      likesCount: 0,
      isViewed: false,
    };
    setStories(prev => [newStory, ...prev]);
  };

  const likeStory = (storyId: string) => {
    setStories(prev =>
      prev.map(s => s.id === storyId ? { ...s, likesCount: s.likesCount + 1 } : s)
    );
  };

  const markStoryViewed = (storyId: string) => {
    setStories(prev =>
      prev.map(s => s.id === storyId ? { ...s, isViewed: true } : s)
    );
  };

  // Calls
  const startCall = (targetUser: User, type: CallType) => {
    soundEffects.startRingtone();
    const session: CallSession = {
      id: `call_${Date.now()}`,
      conversationId: activeConversationId || '',
      caller: currentUser,
      recipient: targetUser,
      type,
      status: 'ringing',
      durationSeconds: 0,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    };
    setCurrentCall(session);

    // Auto connect after 2.5 seconds to simulate partner answering!
    setTimeout(() => {
      soundEffects.playCallConnected();
      setCurrentCall(prev => prev ? { ...prev, status: 'connected', startTime: new Date().toISOString() } : null);
    }, 2500);
  };

  const acceptCall = () => {
    soundEffects.playCallConnected();
    setCurrentCall(prev => prev ? { ...prev, status: 'connected', startTime: new Date().toISOString() } : null);
  };

  const endCall = () => {
    soundEffects.playCallEnded();
    if (currentCall && activeConversationId) {
      // Record call log message in chat
      const logMsg: Message = {
        id: `call_log_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: currentUser.id,
        type: 'call_log',
        content: currentCall.type === 'video'
          ? `تماس تصویری پایان یافت (${Math.floor(currentCall.durationSeconds / 60)}:${String(currentCall.durationSeconds % 60).padStart(2, '0')})`
          : `تماس صوتی پایان یافت (${Math.floor(currentCall.durationSeconds / 60)}:${String(currentCall.durationSeconds % 60).padStart(2, '0')})`,
        timestamp: `${new Date().getHours()}:${new Date().getMinutes()}`,
        status: 'read',
        reactions: [],
      };
      setAllMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), logMsg],
      }));
    }
    setCurrentCall(null);
  };

  const toggleCallMute = () => {
    setCurrentCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleCallVideo = () => {
    setCurrentCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null);
  };

  const toggleCallScreenShare = () => {
    setCurrentCall(prev => prev ? { ...prev, isScreenSharing: !prev.isScreenSharing } : null);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        updateUser,
        contacts: CONTACTS,
        conversations,
        activeConversationId,
        activeConversation,
        setActiveConversationId,
        activeFolder,
        setActiveFolder,
        messages,
        allMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        votePoll,
        pinMessage,
        unpinMessage,
        forwardMessage,
        clearConversationHistory,
        togglePinConversation,
        toggleMuteConversation,
        toggleArchiveConversation,
        createGroup,
        createChannel,
        stories,
        addStory,
        likeStory,
        markStoryViewed,
        currentCall,
        startCall,
        acceptCall,
        endCall,
        toggleCallMute,
        toggleCallVideo,
        toggleCallScreenShare,
        language,
        setLanguage,
        theme,
        setTheme,
        soundEnabled,
        setSoundEnabled,
        searchQuery,
        setSearchQuery,
        drafts,
        setDraft,
        typingUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
