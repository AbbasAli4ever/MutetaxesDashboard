import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/auth';
import type { ApiMessage, ApiConversation, ApiConversationSummary } from '@/types/chat';

interface TypingPayload {
  userId: number;
  userName: string;
  conversationId: string;
}

interface MessagesReadPayload {
  conversationId: string;
  readByUserId: number;
}

export function useChat(
  conversationId: string | null,
  getAccessToken: () => Promise<string | null>,
  onAuthFailed?: () => void,
  onConversationUpdated?: (conv: ApiConversation) => void,
  onMessagesRead?: (convId: string, readByUserId: number) => void,
  onNewConversation?: (conv: ApiConversationSummary) => void,
  /** Fires for every new_message event regardless of which room it came from */
  onAnyNewMessage?: (msg: ApiMessage) => void,
  /** Extra conversation IDs to join (without making them active) */
  watchConversationIds?: string[],
) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectingRef = useRef(false);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [typingUsersMap, setTypingUsersMap] = useState<Map<number, string>>(new Map());
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<string | null>(null);

  // Keep callback refs so socket event handlers always call the latest version
  // without the socket effect needing to re-run when callbacks change.
  const onConvUpdatedRef = useRef(onConversationUpdated);
  const onMsgsReadRef = useRef(onMessagesRead);
  const onNewConvRef = useRef(onNewConversation);
  const onAnyNewMsgRef = useRef(onAnyNewMessage);
  const watchIdsRef = useRef(watchConversationIds);

  useEffect(() => { onConvUpdatedRef.current = onConversationUpdated; }, [onConversationUpdated]);
  useEffect(() => { onMsgsReadRef.current = onMessagesRead; }, [onMessagesRead]);
  useEffect(() => { onNewConvRef.current = onNewConversation; }, [onNewConversation]);
  useEffect(() => { onAnyNewMsgRef.current = onAnyNewMessage; }, [onAnyNewMessage]);
  useEffect(() => { watchIdsRef.current = watchConversationIds; }, [watchConversationIds]);

  // Create socket once per access token
  useEffect(() => {
    let isMounted = true;
    let socket: Socket | null = null;

    const initializeSocket = async () => {
      const accessToken = await getAccessToken();
      if (!accessToken || !isMounted) return;

      socket = io(API_BASE_URL, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });

      socketRef.current = socket;
      socket.connect();

      socket.on('connect', () => {
        reconnectingRef.current = false;
        // Re-join active room
        if (activeConvRef.current) {
          socket?.emit('join_conversation', { conversationId: activeConvRef.current });
        }
        // Join all watch rooms
        watchIdsRef.current?.forEach(id => {
          if (id !== activeConvRef.current) {
            socket?.emit('join_conversation', { conversationId: id });
          }
        });
      });

      socket.on('connect_error', async (err) => {
        console.error('Socket auth failed:', err.message);
        if (reconnectingRef.current) return;
        reconnectingRef.current = true;
        const freshToken = await getAccessToken();
        if (!freshToken || !socket) {
          reconnectingRef.current = false;
          onAuthFailed?.();
          return;
        }
        socket.auth = { token: freshToken };
        socket.connect();
      });

      socket.on('new_message', (msg: ApiMessage) => {
        // Only push into the messages array if it belongs to the active conversation
        if (msg.conversationId === activeConvRef.current) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
        // Always fire the wide callback so the conversation list can update
        onAnyNewMsgRef.current?.(msg);
      });

      socket.on('user_typing', ({ userId, userName, conversationId: cid }: TypingPayload) => {
        if (cid === activeConvRef.current) {
          setTypingUsersMap(prev => new Map(prev).set(userId, userName));
        }
      });

      socket.on('user_stopped_typing', ({ userId, conversationId: cid }: { userId: number; conversationId: string }) => {
        if (cid === activeConvRef.current) {
          setTypingUsersMap(prev => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
        }
      });

      socket.on('messages_read', ({ conversationId: cid, readByUserId }: MessagesReadPayload) => {
        if (cid === activeConvRef.current) {
          setMessages(prev =>
            prev.map(m => m.readBy.includes(readByUserId) ? m : { ...m, readBy: [...m.readBy, readByUserId] })
          );
        }
        onMsgsReadRef.current?.(cid, readByUserId);
      });

      socket.on('conversation_updated', (conv: ApiConversation) => {
        onConvUpdatedRef.current?.(conv);
      });

      socket.on('new_conversation', (conv: ApiConversationSummary) => {
        onNewConvRef.current?.(conv);
      });

      socket.on('error', ({ message }: { message: string }) => {
        console.error('Socket error:', message);
      });
    };

    void initializeSocket();

    return () => {
      isMounted = false;
      reconnectingRef.current = false;
      if (activeConvRef.current) {
        socket?.emit('leave_conversation', { conversationId: activeConvRef.current });
      }
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [getAccessToken, onAuthFailed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join any newly added watch rooms once the socket is already connected
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !watchConversationIds?.length) return;
    watchConversationIds.forEach(id => {
      if (id !== activeConvRef.current) {
        socket.emit('join_conversation', { conversationId: id });
      }
    });
  }, [watchConversationIds]);

  // Join/leave active room when conversationId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (activeConvRef.current && activeConvRef.current !== conversationId) {
      // Only leave if this room isn't also being watched
      if (!watchIdsRef.current?.includes(activeConvRef.current)) {
        socket?.emit('leave_conversation', { conversationId: activeConvRef.current });
      }
    }
    activeConvRef.current = conversationId;
    setTypingUsersMap(new Map());
    if (conversationId && socket?.connected) {
      socket.emit('join_conversation', { conversationId });
    }
  }, [conversationId]);

  const sendMessage = useCallback((body: string) => {
    if (!conversationId || !body.trim()) return;
    socketRef.current?.emit('send_message', { conversationId, body });
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    socketRef.current?.emit('typing_start', { conversationId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { conversationId });
    }, 1500);
  }, [conversationId]);

  const markRead = useCallback(() => {
    if (!conversationId) return;
    socketRef.current?.emit('mark_read', { conversationId });
  }, [conversationId]);

  const typingUsers = useMemo(() => [...typingUsersMap.values()], [typingUsersMap]);

  return { messages, setMessages, typingUsers, sendMessage, handleTyping, markRead };
}
