import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db, MessageEntity } from './state.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  currentRoom?: string;
}

export function setupWebSocketServer(httpServer: HttpServer) {
  // Use noServer: true to cleanly handle only '/ws' requests without interfering with Vite or HTTP
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      // Ignore
    }
  });

  // Map of userId -> Set<WebSocket> for multi-device/multi-tab connection
  const userConnections = new Map<string, Set<AuthenticatedSocket>>();

  const sendToUser = (userId: string, event: string, payload: any) => {
    const sockets = userConnections.get(userId);
    if (sockets) {
      const data = JSON.stringify({ event, payload });
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      }
    }
  };

  const broadcastToAll = (event: string, payload: any) => {
    const data = JSON.stringify({ event, payload });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  };

  const broadcastToConversation = (conversationId: string, event: string, payload: any, excludeUserId?: string) => {
    const conv = db.getConversationById(conversationId);
    if (!conv) return;

    for (const participantId of conv.participantIds) {
      if (excludeUserId && participantId === excludeUserId) continue;
      sendToUser(participantId, event, payload);
    }
  };

  // Heartbeat check every 30s
  const interval = setInterval(() => {
    for (const ws of wss.clients as Set<AuthenticatedSocket>) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (rawData) => {
      try {
        const { event, payload } = JSON.parse(rawData.toString());

        switch (event) {
          // Client Authenticates
          case 'auth': {
            const { userId } = payload;
            if (userId) {
              ws.userId = userId;
              if (!userConnections.has(userId)) {
                userConnections.set(userId, new Set());
              }
              userConnections.get(userId)!.add(ws);

              // Update presence
              const user = db.getUserById(userId);
              if (user) {
                user.status = 'online';
                db.saveUser(user);
                broadcastToAll('presence:update', { userId, status: 'online' });
              }

              // Send initial state confirmation
              ws.send(JSON.stringify({
                event: 'auth:success',
                payload: { userId, onlineUsers: Array.from(userConnections.keys()) }
              }));
            }
            break;
          }

          // User presence update
          case 'presence:status': {
            if (ws.userId) {
              const { status } = payload;
              const user = db.getUserById(ws.userId);
              if (user) {
                user.status = status;
                db.saveUser(user);
                broadcastToAll('presence:update', { userId: ws.userId, status });
              }
            }
            break;
          }

          // Real-time message send
          case 'message:send': {
            const messageData: MessageEntity = payload;
            // Persist message on server as authoritative source of truth
            const savedMessage = db.addMessage(messageData);

            // Broadcast message:new to all participants of this conversation
            broadcastToConversation(savedMessage.conversationId, 'message:new', savedMessage);
            break;
          }

          // Message edit
          case 'message:edit': {
            const { messageId, conversationId, newContent } = payload;
            const updated = db.updateMessage(messageId, conversationId, {
              content: newContent,
              isEdited: true,
              editedAt: `${new Date().getHours()}:${new Date().getMinutes()}`,
            });
            if (updated) {
              broadcastToConversation(conversationId, 'message:edited', updated);
            }
            break;
          }

          // Message delete
          case 'message:delete': {
            const { messageId, conversationId } = payload;
            const deleted = db.deleteMessage(messageId, conversationId);
            if (deleted) {
              broadcastToConversation(conversationId, 'message:deleted', { messageId, conversationId });
            }
            break;
          }

          // Reaction add/toggle
          case 'message:react': {
            const { messageId, conversationId, emoji, userId } = payload;
            const msgs = db.getMessages(conversationId);
            const msg = msgs.find(m => m.id === messageId);
            if (msg) {
              const existingReaction = msg.reactions.find(r => r.emoji === emoji);
              if (existingReaction) {
                if (existingReaction.userIds.includes(userId)) {
                  existingReaction.count = Math.max(0, existingReaction.count - 1);
                  existingReaction.userIds = existingReaction.userIds.filter(id => id !== userId);
                } else {
                  existingReaction.count += 1;
                  existingReaction.userIds.push(userId);
                }
              } else {
                msg.reactions.push({ emoji, count: 1, userIds: [userId] });
              }
              msg.reactions = msg.reactions.filter(r => r.count > 0);
              db.updateMessage(messageId, conversationId, { reactions: msg.reactions });
              broadcastToConversation(conversationId, 'message:reacted', {
                messageId,
                conversationId,
                reactions: msg.reactions,
              });
            }
            break;
          }

          // Poll vote
          case 'message:poll_vote': {
            const { messageId, conversationId, optionId, userId } = payload;
            const msgs = db.getMessages(conversationId);
            const msg = msgs.find(m => m.id === messageId);
            if (msg && msg.poll) {
              const poll = msg.poll;
              const userAlreadyVoted = poll.options.some(opt => opt.votedUserIds.includes(userId));

              poll.options = poll.options.map(opt => {
                if (opt.id === optionId) {
                  const hasVoted = opt.votedUserIds.includes(userId);
                  if (hasVoted) {
                    return {
                      ...opt,
                      votes: Math.max(0, opt.votes - 1),
                      votedUserIds: opt.votedUserIds.filter(id => id !== userId),
                    };
                  } else {
                    return {
                      ...opt,
                      votes: opt.votes + 1,
                      votedUserIds: [...opt.votedUserIds, userId],
                    };
                  }
                } else if (!poll.allowsMultiple && userAlreadyVoted) {
                  return {
                    ...opt,
                    votes: opt.votedUserIds.includes(userId) ? Math.max(0, opt.votes - 1) : opt.votes,
                    votedUserIds: opt.votedUserIds.filter(id => id !== userId),
                  };
                }
                return opt;
              });

              poll.totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
              db.updateMessage(messageId, conversationId, { poll });
              broadcastToConversation(conversationId, 'message:poll_updated', {
                messageId,
                conversationId,
                poll,
              });
            }
            break;
          }

          // Message read receipt
          case 'message:read': {
            const { conversationId, userId } = payload;
            const msgs = db.getMessages(conversationId);
            msgs.forEach(m => {
              if (m.senderId !== userId && m.status !== 'read') {
                m.status = 'read';
              }
            });
            broadcastToConversation(conversationId, 'message:read_receipt', { conversationId, userId });
            break;
          }

          // Typing indicators
          case 'typing:start': {
            const { conversationId, userName } = payload;
            broadcastToConversation(conversationId, 'typing:update', { conversationId, userName, isTyping: true }, ws.userId);
            break;
          }
          case 'typing:stop': {
            const { conversationId, userName } = payload;
            broadcastToConversation(conversationId, 'typing:update', { conversationId, userName, isTyping: false }, ws.userId);
            break;
          }

          // WebRTC Signaling
          case 'call:initiate': {
            const { session, recipientId } = payload;
            sendToUser(recipientId, 'call:incoming', session);
            break;
          }
          case 'call:accept': {
            const { callerId, sessionId } = payload;
            sendToUser(callerId, 'call:accepted', { sessionId });
            break;
          }
          case 'call:signal': {
            const { targetUserId, signalData, sessionId } = payload;
            sendToUser(targetUserId, 'call:signal', { signalData, sessionId, fromUserId: ws.userId });
            break;
          }
          case 'call:end': {
            const { targetUserId, sessionId } = payload;
            sendToUser(targetUserId, 'call:ended', { sessionId });
            break;
          }

          default:
            console.log('Unhandled websocket event:', event);
        }
      } catch (err) {
        console.error('Error handling websocket message:', err);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        const userSockets = userConnections.get(ws.userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            userConnections.delete(ws.userId);
            const user = db.getUserById(ws.userId);
            if (user) {
              user.status = 'offline';
              user.lastSeen = 'همین الان';
              db.saveUser(user);
              broadcastToAll('presence:update', { userId: ws.userId, status: 'offline' });
            }
          }
        }
      }
    });
  });

  return {
    broadcastToAll,
    broadcastToConversation,
    sendToUser,
  };
}
