import { Router, Request, Response } from 'express';
import { db, MessageEntity, ConversationEntity, StoryEntity, UserEntity } from './state.js';

export const apiRouter = Router();

// ========================
// Auth & Profile
// ========================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, username, phoneNumber } = req.body;
  if (!name || !username) {
    return res.status(400).json({ error: 'Name and username are required' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.json({ success: true, user: existing });
  }

  const newUser: UserEntity = {
    id: `user_${Date.now()}`,
    name,
    username: username.replace(/^@/, ''),
    phoneNumber,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    accentColor: '#06b6d4',
  };

  db.saveUser(newUser);
  return res.json({ success: true, user: newUser });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, phoneNumber } = req.body;
  if (username) {
    const user = db.getUserByUsername(username);
    if (user) return res.json({ success: true, user });
  }
  if (phoneNumber) {
    const user = db.getUsers().find(u => u.phoneNumber === phoneNumber);
    if (user) return res.json({ success: true, user });
  }

  // Fallback to primary demo user
  const demoUser = db.getUserById('user_me');
  return res.json({ success: true, user: demoUser });
});

apiRouter.get('/users', (_req: Request, res: Response) => {
  res.json({ success: true, users: db.getUsers() });
});

apiRouter.post('/users/profile', (req: Request, res: Response) => {
  const { id, name, username, bio, status, accentColor } = req.body;
  const user = db.getUserById(id || 'user_me');
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (username) user.username = username.replace(/^@/, '');
  if (bio !== undefined) user.bio = bio;
  if (status) user.status = status;
  if (accentColor) user.accentColor = accentColor;

  db.saveUser(user);
  res.json({ success: true, user });
});

// ========================
// Conversations
// ========================

apiRouter.get('/conversations', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'user_me';
  const list = db.getConversations(userId);
  res.json({ success: true, conversations: list });
});

apiRouter.post('/conversations/group', (req: Request, res: Response) => {
  const { title, description, participantIds, creatorId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const currentUserId = creatorId || 'user_me';
  const participants = Array.from(new Set([currentUserId, ...(participantIds || [])]));

  const newConv: ConversationEntity = {
    id: `group_${Date.now()}`,
    type: 'group',
    title,
    description,
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    updatedAt: `${new Date().getHours()}:${new Date().getMinutes()}`,
    participantIds: participants,
    members: participants.map(id => ({
      userId: id,
      role: id === currentUserId ? 'owner' : 'member',
      joinedAt: new Date().toISOString(),
    })),
  };

  db.saveConversation(newConv);
  res.json({ success: true, conversation: newConv });
});

apiRouter.post('/conversations/channel', (req: Request, res: Response) => {
  const { title, description, username, creatorId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const currentUserId = creatorId || 'user_me';
  const newConv: ConversationEntity = {
    id: `channel_${Date.now()}`,
    type: 'channel',
    title,
    description,
    username: username || `channel_${Date.now()}`,
    avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&auto=format&fit=crop&q=80',
    subscribersCount: 1,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    updatedAt: `${new Date().getHours()}:${new Date().getMinutes()}`,
    participantIds: [currentUserId],
  };

  db.saveConversation(newConv);
  res.json({ success: true, conversation: newConv });
});

// ========================
// Messages
// ========================

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const msgs = db.getMessages(conversationId);
  res.json({ success: true, messages: msgs });
});

apiRouter.post('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const messageData = req.body;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const message: MessageEntity = {
    id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    conversationId,
    senderId: messageData.senderId || 'user_me',
    senderName: messageData.senderName,
    senderAvatar: messageData.senderAvatar,
    type: messageData.type || 'text',
    content: messageData.content || '',
    timestamp: messageData.timestamp || timeStr,
    status: 'delivered',
    replyTo: messageData.replyTo,
    attachments: messageData.attachments,
    poll: messageData.poll,
    reactions: [],
  };

  const saved = db.addMessage(message);
  res.json({ success: true, message: saved });
});

apiRouter.put('/messages/:id', (req: Request, res: Response) => {
  const messageId = req.params.id;
  const { conversationId, content } = req.body;
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

  const updated = db.updateMessage(messageId, conversationId, {
    content,
    isEdited: true,
    editedAt: `${new Date().getHours()}:${new Date().getMinutes()}`,
  });

  if (!updated) return res.status(404).json({ error: 'Message not found' });
  res.json({ success: true, message: updated });
});

apiRouter.delete('/messages/:id', (req: Request, res: Response) => {
  const messageId = req.params.id;
  const { conversationId } = req.body;
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

  const deleted = db.deleteMessage(messageId, conversationId);
  res.json({ success: deleted });
});

// ========================
// Stories
// ========================

apiRouter.get('/stories', (_req: Request, res: Response) => {
  res.json({ success: true, stories: db.getStories() });
});

apiRouter.post('/stories', (req: Request, res: Response) => {
  const { userId, userName, userAvatar, imageUrl, caption } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

  const newStory: StoryEntity = {
    id: `story_${Date.now()}`,
    userId: userId || 'user_me',
    userName: userName || 'امیرمحمد',
    userAvatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    imageUrl,
    caption,
    createdAt: 'لحظاتی پیش',
    expiresAt: '۲۴ ساعت دیگر',
    likesCount: 0,
    isViewed: false,
  };

  const saved = db.addStory(newStory);
  res.json({ success: true, story: saved });
});

apiRouter.post('/stories/:id/like', (req: Request, res: Response) => {
  const storyId = req.params.id;
  const updated = db.likeStory(storyId);
  res.json({ success: !!updated, story: updated });
});

// ========================
// Upload (Files, Audio, Images)
// ========================

apiRouter.post('/upload', (req: Request, res: Response) => {
  const { data, filename, type } = req.body;
  if (!data) return res.status(400).json({ error: 'Data is required' });

  // In this server environment, data URLs or uploaded base64 are served directly
  res.json({
    success: true,
    url: data,
    filename: filename || 'file',
    type: type || 'file',
  });
});
