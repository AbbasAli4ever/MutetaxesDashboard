export type ApiUserType = 'CUSTOMER' | 'ADMIN';

export interface ApiConversationUser {
  id: number;
  name: string;
  email: string;
}

export interface ApiMessageSender {
  id: number;
  name: string;
  type: ApiUserType;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: number;
  sender: ApiMessageSender;
  senderType: ApiUserType;
  body: string;
  readBy: number[];
  createdAt: string;
}

export interface ApiLastMessage {
  body: string;
  createdAt: string;
  senderId: number;
  senderType: ApiUserType;
}

export interface ApiConversation {
  id: string;
  clientId: number;
  client: ApiConversationUser;
  assignedToId: number | null;
  assignedTo: ApiConversationUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConversationSummary extends ApiConversation {
  unreadCount: number;
  lastMessage: ApiLastMessage | null;
}

export interface ApiConversationDetail extends ApiConversation {
  messages: ApiMessage[];
  unreadCount: number;
}
