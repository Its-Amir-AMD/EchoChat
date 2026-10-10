export type UserStatus = 'online' | 'offline' | 'busy' | 'away' | 'dnd';

export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  avatar: string;
  bio?: string;
  status: UserStatus;
  lastSeen?: string;
  customStatus?: string;
  accentColor?: string;
}

export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'file' | 'poll' | 'call_log';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size?: string;
  duration?: number; // for audio/video in seconds
  thumbnailUrl?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedUserIds: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  allowsMultiple: boolean;
  totalVotes: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ReplyContext {
  messageId: string;
  senderName: string;
  content: string;
  type: MessageType;
}

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  timestamp: string;
  status: DeliveryStatus;
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: ReplyContext;
  reactions: Reaction[];
  attachments?: Attachment[];
  poll?: Poll;
  forwardedFrom?: string;
  isPinned?: boolean;
}

export type ConversationType = 'direct' | 'group' | 'channel' | 'bot';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface GroupMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
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
  lastMessage?: {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    timestamp: string;
    type: MessageType;
    status?: DeliveryStatus;
  };
  participantIds: string[];
  members?: GroupMember[];
  subscribersCount?: number;
  typingUsers?: string[];
  pinnedMessageIds?: string[];
}

export interface Story {
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

export type CallType = 'voice' | 'video';

export type CallStatus = 'ringing' | 'connected' | 'ended' | 'declined';

export interface CallSession {
  id: string;
  conversationId: string;
  caller: User;
  recipient: User;
  type: CallType;
  status: CallStatus;
  startTime?: string;
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export type FolderCategory = 'all' | 'direct' | 'groups' | 'channels' | 'bots' | 'unread';
