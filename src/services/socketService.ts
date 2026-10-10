/**
 * Real-time WebSocket Client Service for EchoChat.
 * Connects to the authoritative backend server on /ws.
 */

type SocketEventHandler = (payload: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private currentUserId: string | null = null;
  private handlers = new Map<string, Set<SocketEventHandler>>();
  private reconnectTimeout: number | null = null;
  private isConnected: boolean = false;

  public connect(userId: string) {
    this.currentUserId = userId;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      // Already active or connecting
      this.send('auth', { userId });
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        // Authenticate with server
        this.send('auth', { userId: this.currentUserId });
        this.emitLocal('connection:status', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const { event: eventName, payload } = JSON.parse(event.data);
          this.emitLocal(eventName, payload);
        } catch {
          // Ignore malformed packet
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.emitLocal('connection:status', { connected: false });
        this.scheduleReconnect();
      };

      this.socket.onerror = (e: any) => {
        // Silently suppress error event to prevent uncaught browser console noise
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.currentUserId) {
        this.connect(this.currentUserId);
      }
    }, 2500);
  }

  public send(event: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, payload }));
    }
  }

  public on(event: string, handler: SocketEventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: SocketEventHandler) {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  private emitLocal(event: string, payload: any) {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        handler(payload);
      }
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
