# 11 — Chat & Real-Time Messaging Integration

This document covers everything the frontend needs to implement the chat feature end-to-end: REST API calls, Socket.io connection, authentication, all events, TypeScript types, and a React usage example.

---

## Overview

The chat system has two layers:

| Layer | Purpose | Auth |
|---|---|---|
| **REST API** | Create conversations, list/get conversations, paginated history, admin management | `Authorization: Bearer <token>` header |
| **Socket.io** | Real-time message delivery, typing indicators, read receipts | `socket.handshake.auth.token` |

Both layers use the **same JWT access token** from `/auth/login`.

---

## 1. Install the Socket.io Client

```bash
npm install socket.io-client
```

---

## 2. TypeScript Types

```ts
type ConversationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ConversationPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
type UserType = 'CUSTOMER' | 'ADMIN';

interface ConversationUser {
  id: number;
  name: string;
  email: string;
}

interface MessageSender {
  id: number;
  name: string;
  type: UserType;
}

interface Message {
  id: string;           // UUID
  conversationId: string;
  senderId: number;
  sender: MessageSender;
  senderType: UserType;
  body: string;
  readBy: number[];     // array of user IDs who have read this message
  createdAt: string;    // ISO date string
}

interface LastMessage {
  body: string;
  createdAt: string;
  senderId: number;
  senderType: UserType;
}

interface Conversation {
  id: string;           // UUID
  subject: string;
  category: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  clientId: number;
  client: ConversationUser;
  assignedToId: number | null;
  assignedTo: ConversationUser | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface ConversationSummary extends Conversation {
  unreadCount: number;
  lastMessage: LastMessage | null;
}

interface ConversationDetail extends Conversation {
  messages: Message[];
  unreadCount: number;
}

// Socket event payloads
interface TypingPayload {
  userId: number;
  userName: string;
  conversationId: string;
}

interface MessagesReadPayload {
  conversationId: string;
  readByUserId: number;
}
```

---

## 3. REST API Reference

**Base URL:** `https://api.mutetaxes.com` (or `http://localhost:5000` in dev)

All REST endpoints require the `Authorization: Bearer <token>` header.

### 3.1 Create a Conversation

```
POST /api/v1/conversations
Permission: MESSAGES_CREATE
```

**Request body:**
```json
{
  "subject": "Question about my annual return filing",
  "category": "renewals",
  "priority": "MEDIUM",

  // Admin only — ignored for CUSTOMER callers:
  "clientId": 5,
  "assignedToId": 2
}
```
> Customers do not need to send `clientId` — it is set automatically from their JWT.

**Response `201`:**
```json
{
  "success": true,
  "message": "Conversation created",
  "conversation": { /* Conversation object */ }
}
```

---

### 3.2 List Conversations

```
GET /api/v1/conversations
Permission: MESSAGES_READ
```

**Query params (all optional):**

| Param | Type | Notes |
|---|---|---|
| `status` | `OPEN \| IN_PROGRESS \| RESOLVED \| CLOSED` | Filter by status |
| `priority` | `URGENT \| HIGH \| MEDIUM \| LOW` | Filter by priority |
| `clientId` | `integer` | Admin only |
| `assignedToId` | `integer` | Admin only |

> Customers automatically see only their own conversations regardless of query params.

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "conversations": [ /* ConversationSummary[] — includes unreadCount and lastMessage */ ]
}
```

---

### 3.3 Get a Conversation (with initial messages)

```
GET /api/v1/conversations/:id
Permission: MESSAGES_READ
```

Returns the conversation metadata **plus the latest 30 messages** (ascending order, oldest first). This is the initial load when opening a chat window.

**Response `200`:**
```json
{
  "success": true,
  "conversation": {
    /* ...Conversation fields... */
    "messages": [ /* Message[] — last 30, ascending */ ],
    "unreadCount": 2
  }
}
```

---

### 3.4 Load Older Messages (scroll-up pagination)

```
GET /api/v1/conversations/:id/messages
Permission: MESSAGES_READ
```

**Query params:**

| Param | Type | Notes |
|---|---|---|
| `before` | `string (UUID)` | Returns messages older than this message ID |
| `limit` | `integer` | Default `30`, max `100` |

**Flow:**
1. Open conversation → initial 30 messages already in `GET /conversations/:id`
2. User scrolls to the top → call this endpoint with `before=<id of oldest loaded message>`
3. Prepend returned messages to the top of the list
4. Repeat using `nextCursor` as the next `before` value
5. Stop when `hasMore` is `false`

**Response `200`:**
```json
{
  "success": true,
  "messages": [ /* Message[] — ascending */ ],
  "nextCursor": "uuid-or-null",
  "hasMore": true
}
```

---

### 3.5 Update a Conversation (Admin only)

```
PATCH /api/v1/conversations/:id
Permission: MESSAGES_UPDATE
```

**Request body (all fields optional):**
```json
{
  "status": "RESOLVED",
  "priority": "HIGH",
  "assignedToId": 3,
  "subject": "Updated subject",
  "category": "compliance"
}
```

> Setting `status` to `RESOLVED` or `CLOSED` automatically sets `closedAt`.
> All clients in the conversation room will receive a `conversation_updated` socket event.

---

### 3.6 Delete a Conversation (Admin only)

```
DELETE /api/v1/conversations/:id
Permission: MESSAGES_DELETE
```

Soft-deletes the conversation. It disappears from all subsequent queries.

---

## 4. Socket.io Integration

### 4.1 Connect

```ts
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('https://api.mutetaxes.com', {
  auth: {
    token: accessToken,  // same JWT from /auth/login — no "Bearer " prefix needed
  },
  transports: ['websocket', 'polling'],
  autoConnect: false,
});

socket.connect();

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket auth failed:', err.message);
  // "Authentication required" | "Invalid or expired token" | "Unauthorized"
});
```

> **Token refresh:** If the access token expires (15 min), disconnect, get a new token via `POST /auth/refresh`, then reconnect with the updated token.

---

### 4.2 Events: Client → Server

#### `join_conversation`
Join a conversation's real-time room. Must be called before receiving messages for a conversation.

```ts
socket.emit('join_conversation', { conversationId: 'uuid' });

// Confirmation:
socket.on('joined_conversation', ({ conversationId }) => {
  console.log('Now listening to', conversationId);
});
```

---

#### `leave_conversation`
Leave a conversation room (e.g. when navigating away).

```ts
socket.emit('leave_conversation', { conversationId: 'uuid' });
```

---

#### `send_message`
Send a message. The server persists it and broadcasts to all room members (including the sender).

```ts
socket.emit('send_message', {
  conversationId: 'uuid',
  body: 'Hello, I need help with my filing.',
});
```

> **Important:** You do **not** need to call a REST endpoint to send a message — socket is the only path.

---

#### `mark_read`
Mark all unread messages in a conversation as read for the current user. Call this when the user opens a conversation or scrolls to the bottom.

```ts
socket.emit('mark_read', { conversationId: 'uuid' });
```

---

#### `typing_start` / `typing_stop`
Broadcast typing indicator to other participants. Not persisted.

```ts
// Start debounced on input change:
socket.emit('typing_start', { conversationId: 'uuid' });

// Stop when input is empty or after a timeout:
socket.emit('typing_stop', { conversationId: 'uuid' });
```

---

### 4.3 Events: Server → Client

#### `new_message`
Fired for every new message in a room — both to the sender (as confirmation) and to other participants.

```ts
socket.on('new_message', (message: Message) => {
  // Append to local message list
});
```

---

#### `messages_read`
Fired when a participant reads messages. Use this to update read receipt UI.

```ts
socket.on('messages_read', ({ conversationId, readByUserId }: MessagesReadPayload) => {
  // Mark messages as read for readByUserId in the local state
});
```

---

#### `user_typing` / `user_stopped_typing`
Typing indicator events. Only broadcast to other participants, not the sender.

```ts
socket.on('user_typing', ({ userId, userName, conversationId }: TypingPayload) => {
  // Show "Jane is typing..." indicator
});

socket.on('user_stopped_typing', ({ userId, conversationId }) => {
  // Hide typing indicator
});
```

---

#### `conversation_updated`
Fired when an admin updates a conversation's metadata (status, priority, assignee). Useful for updating the conversation header in real time.

```ts
socket.on('conversation_updated', (conversation: Conversation) => {
  // Update local conversation metadata
});
```

---

#### `error`
Fired when a socket operation fails (auth issue, access denied, closed conversation, etc.).

```ts
socket.on('error', ({ message }: { message: string }) => {
  console.error('Socket error:', message);
});
```

---

## 5. Recommended React Pattern

```tsx
// hooks/useChat.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useChat(conversationId: string, accessToken: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect socket once
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_conversation', { conversationId });
    });

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', ({ userId, userName }: TypingPayload) => {
      setTypingUsers((prev) => new Set(prev).add(userName));
    });

    socket.on('user_stopped_typing', ({ userName }: { userName: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userName);
        return next;
      });
    });

    socket.on('messages_read', ({ readByUserId }: MessagesReadPayload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.readBy.includes(readByUserId) ? m : { ...m, readBy: [...m.readBy, readByUserId] }
        )
      );
    });

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.disconnect();
    };
  }, [conversationId, accessToken]);

  const sendMessage = useCallback((body: string) => {
    socketRef.current?.emit('send_message', { conversationId, body });
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    socketRef.current?.emit('typing_start', { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { conversationId });
    }, 1500);
  }, [conversationId]);

  const markRead = useCallback(() => {
    socketRef.current?.emit('mark_read', { conversationId });
  }, [conversationId]);

  return { messages, typingUsers, sendMessage, handleTyping, markRead };
}
```

**Usage:**
```tsx
function ChatWindow({ conversationId }: { conversationId: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const { messages, typingUsers, sendMessage, handleTyping, markRead } = useChat(conversationId, token);

  useEffect(() => {
    markRead(); // mark as read when chat is opened
  }, [conversationId]);

  return (
    <div>
      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
      {typingUsers.size > 0 && <p>{[...typingUsers].join(', ')} is typing…</p>}
      <MessageInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
}
```

---

## 6. Loading Older Messages (Infinite Scroll)

```ts
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [hasMore, setHasMore] = useState(true);

async function loadOlderMessages(oldestMessageId: string) {
  const res = await fetch(
    `/api/v1/conversations/${conversationId}/messages?before=${oldestMessageId}&limit=30`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  setMessages((prev) => [...data.messages, ...prev]); // prepend
  setNextCursor(data.nextCursor);
  setHasMore(data.hasMore);
}
```

---

## 7. Permission Reference

| User type | Permissions granted by seed | What they can do |
|---|---|---|
| Customer | `MESSAGES_READ`, `MESSAGES_CREATE` | Create conversations, send/read messages for their own conversations |
| Operations Admin | `MESSAGES_READ`, `MESSAGES_CREATE`, `MESSAGES_UPDATE`, `MESSAGES_DELETE` | Full access to all conversations |
| Super Admin | All permissions | Full access |

---

## 8. Unread Count Badge

The list endpoint (`GET /api/v1/conversations`) returns `unreadCount` per conversation — use this for badge rendering. After the user opens a conversation and calls `mark_read` via socket, update the local unread count to `0`.

```ts
socket.on('messages_read', ({ conversationId, readByUserId }) => {
  if (readByUserId === currentUserId) {
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  }
});
```
