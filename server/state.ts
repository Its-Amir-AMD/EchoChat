import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../echochat_db.json');

export interface UserEntity {
  id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'offline' | 'busy' | 'away' | 'dnd';
  lastSeen?: string;
  customStatus?: string;
  accentColor?: string;
}

export interface AttachmentEntity {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface PollEntity {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
    votedUserIds: string[];
  }[];
  isAnonymous: boolean;
  allowsMultiple: boolean;
  totalVotes: number;
}

export interface ReactionEntity {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  type: 'text' | 'voice' | 'image' | 'video' | 'file' | 'poll' | 'call_log';
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
    type: string;
  };
  reactions: ReactionEntity[];
  attachments?: AttachmentEntity[];
  poll?: PollEntity;
  forwardedFrom?: string;
  isPinned?: boolean;
}

export interface ConversationEntity {
  id: string;
  type: 'direct' | 'group' | 'channel' | 'bot';
  title: string;
  avatar: string;
  description?: string;
  username?: string;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  unreadCount: number;
  draft?: string;
  updatedAt: string;
  participantIds: string[];
  members?: { userId: string; role: 'owner' | 'admin' | 'moderator' | 'member'; joinedAt: string }[];
  subscribersCount?: number;
  pinnedMessageIds?: string[];
  lastMessage?: {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    timestamp: string;
    type: 'text' | 'voice' | 'image' | 'video' | 'file' | 'poll' | 'call_log';
    status?: 'sending' | 'sent' | 'delivered' | 'read';
  };
}

export interface StoryEntity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  likesCount: number;
  isViewed: boolean;
}

export interface DatabaseSchema {
  users: UserEntity[];
  conversations: ConversationEntity[];
  messages: Record<string, MessageEntity[]>;
  stories: StoryEntity[];
}

// Initial default seed
const DEFAULT_USERS: UserEntity[] = [
  {
    id: 'user_me',
    name: 'امیرمحمد',
    username: 'amir_echo',
    phoneNumber: '+98 912 345 6789',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'توسعه‌دهنده سیستم‌های بلادرنگ و علاقه‌مند به هوش مصنوعی ⚡',
    status: 'online',
    customStatus: 'در حال کار روی اکوچت ✨',
    accentColor: '#06b6d4',
  },
  {
    id: 'user_ai',
    name: 'دستیار هوشمند اکوچت',
    username: 'echo_ai',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'دستیار هوش مصنوعی اکوچت. خلاصه‌سازی، ترجمه، و پاسخ به سوالات شما.',
    status: 'online',
    customStatus: 'همیشه آنلاین 🤖',
  },
  {
    id: 'user_sara',
    name: 'سارا علی‌پور',
    username: 'sara_alipour',
    phoneNumber: '+98 935 111 2233',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'طراح رابط کاربری و تجربه کاربری (UI/UX) 🎨',
    status: 'online',
    lastSeen: 'لحظاتی پیش',
  },
  {
    id: 'user_reza',
    name: 'رضا تهرانی',
    username: 'reza_teh',
    phoneNumber: '+98 912 888 9900',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'مدیر زیرساخت و دواپس ☁️',
    status: 'away',
    lastSeen: '۱۰ دقیقه پیش',
  },
  {
    id: 'user_negin',
    name: 'نگین حسینی',
    username: 'negin_h',
    phoneNumber: '+98 919 444 5566',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'مهندس امنیت اطلاعات و رمزنگاری 🛡️',
    status: 'busy',
    lastSeen: '۱ ساعت پیش',
  },
];

const DEFAULT_CONVERSATIONS: ConversationEntity[] = [
  {
    id: 'conv_saved',
    type: 'direct',
    title: 'پیام‌های ذخیره‌شده (Saved Messages)',
    avatar: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=150&auto=format&fit=crop&q=80',
    username: 'saved_messages',
    isPinned: true,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    updatedAt: '12:45',
    participantIds: ['user_me'],
    lastMessage: {
      id: 'msg_saved_1',
      senderId: 'user_me',
      content: 'یادداشت: چک‌لیست انتشار نسخه جدید اکوچت با پشتیبانی کامل تماس تصویری و صوتی',
      timestamp: '12:45',
      type: 'text',
      status: 'read',
    },
  },
  {
    id: 'conv_ai',
    type: 'bot',
    title: 'EchoChat AI Assistant',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    username: 'echo_ai',
    isPinned: true,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    updatedAt: '12:40',
    participantIds: ['user_me', 'user_ai'],
    lastMessage: {
      id: 'msg_ai_1',
      senderId: 'user_ai',
      senderName: 'EchoChat AI',
      content: 'سلام امیرمحمد عزیز! من دستیار هوشمند اکوچت هستم. چطور می‌توانم کمکتان کنم؟ ✨',
      timestamp: '12:40',
      type: 'text',
      status: 'delivered',
    },
  },
  {
    id: 'conv_sara',
    type: 'direct',
    title: 'سارا علی‌پور',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    username: 'sara_alipour',
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 1,
    updatedAt: '12:30',
    participantIds: ['user_me', 'user_sara'],
    lastMessage: {
      id: 'msg_sara_3',
      senderId: 'user_sara',
      senderName: 'سارا علی‌پور',
      content: 'طرح جدید صفحه چت و استوری‌ها رو آماده کردم، لطفاً بررسیش کن.',
      timestamp: '12:30',
      type: 'text',
      status: 'delivered',
    },
  },
  {
    id: 'conv_group_dev',
    type: 'group',
    title: 'تیم فنی اکوچت (Core Engineering)',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    description: 'گروه هماهنگی تیم مهندسی، زیرساخت بلادرنگ و هوش مصنوعی اکوچت',
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    updatedAt: '11:15',
    participantIds: ['user_me', 'user_sara', 'user_reza', 'user_negin'],
    members: [
      { userId: 'user_me', role: 'owner', joinedAt: '2026-01-01' },
      { userId: 'user_sara', role: 'admin', joinedAt: '2026-01-02' },
      { userId: 'user_reza', role: 'moderator', joinedAt: '2026-01-05' },
      { userId: 'user_negin', role: 'member', joinedAt: '2026-01-10' },
    ],
    lastMessage: {
      id: 'msg_grp_poll',
      senderId: 'user_reza',
      senderName: 'رضا تهرانی',
      content: 'نظرسنجی: تاریخ انتشار نسخه جدید سرور',
      timestamp: '11:15',
      type: 'poll',
      status: 'read',
    },
  },
  {
    id: 'conv_channel_echo',
    type: 'channel',
    title: 'کانال رسمی اکوچت | EchoChat Official',
    avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&auto=format&fit=crop&q=80',
    description: 'آخرین اخبار، به‌روزرسانی‌ها و قابلیت‌های پلتفرم پیام‌رسان اکوچت',
    username: 'echochat_news',
    subscribersCount: 24850,
    isPinned: false,
    isMuted: true,
    isArchived: false,
    unreadCount: 0,
    updatedAt: 'دیروز',
    participantIds: ['user_me'],
    lastMessage: {
      id: 'msg_ch_1',
      senderId: 'channel',
      content: '🎉 انتشار نسخه جدید اکوچت با تماس‌های صوتی و تصویری آنی و دستیار هوش مصنوعی.',
      timestamp: 'دیروز',
      type: 'text',
      status: 'read',
    },
  },
];

const DEFAULT_MESSAGES: Record<string, MessageEntity[]> = {
  conv_saved: [
    {
      id: 'msg_s_1',
      conversationId: 'conv_saved',
      senderId: 'user_me',
      type: 'text',
      content: '📌 یادداشت: چک‌لیست انتشار نسخه جدید اکوچت با پشتیبانی کامل تماس تصویری و صوتی',
      timestamp: '12:45',
      status: 'read',
      reactions: [],
    },
  ],
  conv_ai: [
    {
      id: 'msg_ai_1',
      conversationId: 'conv_ai',
      senderId: 'user_ai',
      senderName: 'EchoChat AI',
      type: 'text',
      content: 'سلام امیرمحمد عزیز! من دستیار هوشمند اکوچت هستم. چطور می‌توانم در نوشتن پیام، خلاصه مکالمات یا پاسخ به سوالات کمکتان کنم؟ ✨',
      timestamp: '12:40',
      status: 'delivered',
      reactions: [{ emoji: '👍', count: 1, userIds: ['user_me'] }],
    },
  ],
  conv_sara: [
    {
      id: 'msg_sara_1',
      conversationId: 'conv_sara',
      senderId: 'user_sara',
      senderName: 'سارا علی‌پور',
      type: 'text',
      content: 'سلام امیرمحمد! طراحی جدید کارت‌های پیام و ویجت تماس صوتی آماده شد.',
      timestamp: '12:15',
      status: 'read',
      reactions: [{ emoji: '👏', count: 1, userIds: ['user_me'] }],
    },
    {
      id: 'msg_sara_voice',
      conversationId: 'conv_sara',
      senderId: 'user_sara',
      senderName: 'سارا علی‌پور',
      type: 'voice',
      content: 'پیام صوتی (Voice Message)',
      timestamp: '12:20',
      status: 'read',
      reactions: [{ emoji: '❤️', count: 1, userIds: ['user_me'] }],
      attachments: [
        {
          id: 'att_voice_1',
          type: 'audio',
          url: '',
          name: 'صدای ضبط شده',
          duration: 18,
          size: '180 KB',
        },
      ],
    },
    {
      id: 'msg_sara_3',
      conversationId: 'conv_sara',
      senderId: 'user_sara',
      senderName: 'سارا علی‌پور',
      type: 'text',
      content: 'طرح جدید صفحه چت و استوری‌ها رو آماده کردم، لطفاً بررسیش کن.',
      timestamp: '12:30',
      status: 'delivered',
      reactions: [],
      attachments: [
        {
          id: 'att_img_1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          name: 'echochat_ui_preview.png',
          size: '1.2 MB',
        },
      ],
    },
  ],
  conv_group_dev: [
    {
      id: 'msg_grp_1',
      conversationId: 'conv_group_dev',
      senderId: 'user_negin',
      senderName: 'نگین حسینی',
      type: 'text',
      content: 'تست‌های رمزنگاری لایه ارتباطی با موفقیت پاس شدند. امنیت اتصالات برقرار است.',
      timestamp: '10:55',
      status: 'read',
      reactions: [{ emoji: '🛡️', count: 2, userIds: ['user_me', 'user_reza'] }],
    },
    {
      id: 'msg_grp_poll',
      conversationId: 'conv_group_dev',
      senderId: 'user_reza',
      senderName: 'رضا تهرانی',
      type: 'poll',
      content: 'نظرسنجی درباره زمان به‌روزرسانی سرورها',
      timestamp: '11:15',
      status: 'read',
      reactions: [],
      poll: {
        id: 'poll_1',
        question: 'بهترین زمان برای استقرار نسخه جدید سرور اکوچت چه زمانی است؟',
        isAnonymous: false,
        allowsMultiple: false,
        totalVotes: 3,
        options: [
          { id: 'opt_1', text: 'امشب ساعت ۲۳:۰۰', votes: 2, votedUserIds: ['user_me', 'user_reza'] },
          { id: 'opt_2', text: 'فردا صبح ساعت ۰۸:۰۰', votes: 1, votedUserIds: ['user_sara'] },
          { id: 'opt_3', text: 'آخر هفته (پنجشنبه)', votes: 0, votedUserIds: [] },
        ],
      },
    },
  ],
  conv_channel_echo: [
    {
      id: 'msg_ch_1',
      conversationId: 'conv_channel_echo',
      senderId: 'channel',
      type: 'text',
      content: '🎉 انتشار نسخه جدید اکوچت با تماس‌های صوتی و تصویری آنی و هوش مصنوعی.',
      timestamp: 'دیروز',
      status: 'read',
      reactions: [
        { emoji: '🔥', count: 142, userIds: ['user_me'] },
        { emoji: '❤️', count: 98, userIds: [] },
      ],
      attachments: [
        {
          id: 'att_banner_1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&auto=format&fit=crop&q=80',
          name: 'echochat_release_banner.jpg',
          size: '850 KB',
        },
      ],
    },
  ],
};

const DEFAULT_STORIES: StoryEntity[] = [
  {
    id: 'story_sara',
    userId: 'user_sara',
    userName: 'سارا علی‌پور',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'غروب زیبای کوهستان دماوند 🏔️✨',
    createdAt: '۳ ساعت پیش',
    expiresAt: '۲۱ ساعت دیگر',
    likesCount: 14,
    isViewed: false,
  },
  {
    id: 'story_group',
    userId: 'user_reza',
    userName: 'تیم فنی اکوچت',
    userAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    caption: 'آماده‌سازی خوشه‌های سروری جدید با تأخیر کمتر از ۱۰ میلی‌ثانیه 🚀',
    createdAt: '۵ ساعت پیش',
    expiresAt: '۱۹ ساعت دیگر',
    likesCount: 29,
    isViewed: false,
  },
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read database file, initializing default:', err);
    }

    const initial: DatabaseSchema = {
      users: DEFAULT_USERS,
      conversations: DEFAULT_CONVERSATIONS,
      messages: DEFAULT_MESSAGES,
      stories: DEFAULT_STORIES,
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public getUsers(): UserEntity[] {
    return this.data.users;
  }

  public getUserById(id: string): UserEntity | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): UserEntity | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public saveUser(user: UserEntity): UserEntity {
    const existingIndex = this.data.users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      this.data.users[existingIndex] = user;
    } else {
      this.data.users.push(user);
    }
    this.saveData(this.data);
    return user;
  }

  public getConversations(userId?: string): ConversationEntity[] {
    if (!userId) return this.data.conversations;
    return this.data.conversations.filter(c =>
      c.participantIds.includes(userId) || c.type === 'channel'
    );
  }

  public getConversationById(id: string): ConversationEntity | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  public saveConversation(conv: ConversationEntity): ConversationEntity {
    const index = this.data.conversations.findIndex(c => c.id === conv.id);
    if (index >= 0) {
      this.data.conversations[index] = conv;
    } else {
      this.data.conversations.unshift(conv);
    }
    this.saveData(this.data);
    return conv;
  }

  public getMessages(conversationId: string): MessageEntity[] {
    return this.data.messages[conversationId] || [];
  }

  public addMessage(message: MessageEntity): MessageEntity {
    if (!this.data.messages[message.conversationId]) {
      this.data.messages[message.conversationId] = [];
    }
    // Prevent duplicate
    const exists = this.data.messages[message.conversationId].some(m => m.id === message.id);
    if (!exists) {
      this.data.messages[message.conversationId].push(message);
    }

    // Update conversation last message & timestamp
    const conv = this.getConversationById(message.conversationId);
    if (conv) {
      conv.updatedAt = message.timestamp;
      conv.lastMessage = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.type === 'poll' ? (message.poll?.question || 'نظرسنجی') : message.content,
        timestamp: message.timestamp,
        type: message.type,
        status: message.status,
      };
      this.saveConversation(conv);
    }

    this.saveData(this.data);
    return message;
  }

  public updateMessage(messageId: string, conversationId: string, updates: Partial<MessageEntity>): MessageEntity | null {
    const list = this.data.messages[conversationId];
    if (!list) return null;
    const msg = list.find(m => m.id === messageId);
    if (!msg) return null;

    Object.assign(msg, updates);
    this.saveData(this.data);
    return msg;
  }

  public deleteMessage(messageId: string, conversationId: string): boolean {
    const list = this.data.messages[conversationId];
    if (!list) return false;
    const index = list.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    list.splice(index, 1);
    this.saveData(this.data);
    return true;
  }

  public getStories(): StoryEntity[] {
    return this.data.stories;
  }

  public addStory(story: StoryEntity): StoryEntity {
    this.data.stories.unshift(story);
    this.saveData(this.data);
    return story;
  }

  public likeStory(storyId: string): StoryEntity | null {
    const story = this.data.stories.find(s => s.id === storyId);
    if (!story) return null;
    story.likesCount += 1;
    this.saveData(this.data);
    return story;
  }
}

export const db = new DatabaseService();
