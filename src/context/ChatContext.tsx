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
import { socketService } from '../services/socketService';

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
  isServerConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'echochat_v2_';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [isServerConnected, setIsServerConnected] = useState(false);

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

  // Connect WebSocket to real backend
  useEffect(() => {
    socketService.connect(currentUser.id);

    // Initial fetch from backend REST API
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.conversations?.length > 0) {
          setConversations(data.conversations);
        }
      })
      .catch(() => {});

    fetch('/api/stories')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stories?.length > 0) {
          setStories(data.stories);
        }
      })
      .catch(() => {});

    // Listen to socket events
    const unsubConn = socketService.on('connection:status', payload => {
      setIsServerConnected(payload.connected);
    });

    const unsubMsg = socketService.on('message:new', (msg: Message) => {
      setAllMessages(prev => {
        const list = prev[msg.conversationId] || [];
        // Guard idempotency
        if (list.some(m => m.id === msg.id)) return prev;
        return {
          ...prev,
          [msg.conversationId]: [...list, msg],
        };
      });

      if (msg.senderId !== currentUser.id) {
        soundEffects.playMessageReceived();
      }

      setConversations(prev =>
        prev.map(c =>
          c.id === msg.conversationId
            ? {
                ...c,
                updatedAt: msg.timestamp,
                lastMessage: {
                  id: msg.id,
                  senderId: msg.senderId,
                  senderName: msg.senderName,
                  content: msg.type === 'poll' ? (msg.poll?.question || 'نظرسنجی') : msg.content,
                  timestamp: msg.timestamp,
                  type: msg.type,
                  status: msg.status,
                },
              }
            : c
        )
      );
    });

    const unsubEdit = socketService.on('message:edited', (updated: Message) => {
      setAllMessages(prev => {
        const list = prev[updated.conversationId] || [];
        return {
          ...prev,
          [updated.conversationId]: list.map(m => m.id === updated.id ? updated : m),
        };
      });
    });

    const unsubDelete = socketService.on('message:deleted', ({ messageId, conversationId }) => {
      setAllMessages(prev => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.filter(m => m.id !== messageId),
        };
      });
    });

    const unsubReact = socketService.on('message:reacted', ({ messageId, conversationId, reactions }) => {
      setAllMessages(prev => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map(m => m.id === messageId ? { ...m, reactions } : m),
        };
      });
    });

    const unsubPoll = socketService.on('message:poll_updated', ({ messageId, conversationId, poll }) => {
      setAllMessages(prev => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map(m => m.id === messageId ? { ...m, poll } : m),
        };
      });
    });

    const unsubTyping = socketService.on('typing:update', ({ conversationId, userName, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter(u => u !== userName);
        }
      });
    });

    const unsubCallInc = socketService.on('call:incoming', (session: CallSession) => {
      soundEffects.startRingtone();
      setCurrentCall(session);
    });

    const unsubCallAcc = socketService.on('call:accepted', () => {
      soundEffects.playCallConnected();
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
    });

    const unsubCallEnd = socketService.on('call:ended', () => {
      soundEffects.playCallEnded();
      setCurrentCall(null);
    });

    return () => {
      unsubConn();
      unsubMsg();
      unsubEdit();
      unsubDelete();
      unsubReact();
      unsubPoll();
      unsubTyping();
      unsubCallInc();
      unsubCallAcc();
      unsubCallEnd();
      socketService.disconnect();
    };
  }, [currentUser.id]);

  // Load conversation messages from server when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetch(`/api/conversations/${activeConversationId}/messages`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages?.length > 0) {
            setAllMessages(prev => ({
              ...prev,
              [activeConversationId]: data.messages,
            }));
          }
        })
        .catch(() => {});
    }
  }, [activeConversationId]);

  // Sync state to localStorage
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
    setCurrentUser(prev => {
      const next = { ...prev, ...updated };
      fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
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

    // Optimistic local update
    setAllMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

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

    // Send through WebSocket to real backend
    socketService.send('message:send', newMsg);

    // Post to REST API for persistent server-side storage
    fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});

    // Clear draft
    setDraft(convId, '');

    // Bot / Echo AI handling
    const targetConv = conversations.find(c => c.id === convId);
    if (targetConv && (targetConv.type === 'bot' || targetConv.id === 'conv_ai')) {
      setTypingUsers([targetConv.title]);
      setTimeout(async () => {
        setTypingUsers([]);
        
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

        socketService.send('message:send', botMsg);
      }, 1200);
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

    socketService.send('message:edit', {
      messageId,
      conversationId: activeConversationId,
      newContent,
    });
  };

  const deleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).filter(m => m.id !== messageId),
    }));

    socketService.send('message:delete', {
      messageId,
      conversationId: activeConversationId,
    });
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    socketService.send('message:react', {
      messageId,
      conversationId: activeConversationId,
      emoji,
      userId: currentUser.id,
    });

    // Optimistic update
    setAllMessages(prev => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map(m => {
        if (m.id === messageId) {
          const existing = m.reactions.find(r => r.emoji === emoji);
          let updatedReactions = [...m.reactions];
          if (existing) {
            if (existing.userIds.includes(currentUser.id)) {
              updatedReactions = updatedReactions
                .map(r => r.emoji === emoji ? { ...r, count: r.count - 1, userIds: r.userIds.filter(id => id !== currentUser.id) } : r)
                .filter(r => r.count > 0);
            } else {
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
    socketService.send('message:poll_vote', {
      messageId,
      conversationId: activeConversationId,
      optionId,
      userId: currentUser.id,
    });
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

    socketService.send('message:send', forwardedMsg);
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

    fetch('/api/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, participantIds, creatorId: currentUser.id }),
    }).catch(() => {});

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

    fetch('/api/conversations/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, username, creatorId: currentUser.id }),
    }).catch(() => {});

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

    fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStory),
    }).catch(() => {});
  };

  const likeStory = (storyId: string) => {
    setStories(prev =>
      prev.map(s => s.id === storyId ? { ...s, likesCount: s.likesCount + 1 } : s)
    );

    fetch(`/api/stories/${storyId}/like`, { method: 'POST' }).catch(() => {});
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

    socketService.send('call:initiate', { session, recipientId: targetUser.id });

    // Auto connect after 2.5 seconds to simulate answer if partner is an offline bot/test
    setTimeout(() => {
      soundEffects.playCallConnected();
      setCurrentCall(prev => prev ? { ...prev, status: 'connected', startTime: new Date().toISOString() } : null);
    }, 2500);
  };

  const acceptCall = () => {
    soundEffects.playCallConnected();
    setCurrentCall(prev => prev ? { ...prev, status: 'connected', startTime: new Date().toISOString() } : null);
    if (currentCall) {
      socketService.send('call:accept', { callerId: currentCall.caller.id, sessionId: currentCall.id });
    }
  };

  const endCall = () => {
    soundEffects.playCallEnded();
    if (currentCall) {
      socketService.send('call:end', { targetUserId: currentCall.recipient.id, sessionId: currentCall.id });
      if (activeConversationId) {
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
        socketService.send('message:send', logMsg);
      }
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
        isServerConnected,
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
