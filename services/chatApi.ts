import api from './api';

export interface Conversation {
  id: string;
  participant_admin_id: string | null;
  participant_user_id: string;
  admin_name?: string;
  user_name?: string;
  user_role?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export const chatApi = {
  getConversations: (): Promise<{ conversations: Conversation[] }> =>
    api.get('/chat/conversations').then((r) => r.data),

  createConversation: (): Promise<{ conversation: Conversation; existing: boolean }> =>
    api.post('/chat/conversations', {}).then((r) => r.data),

  getMessages: (conversationId: string, cursor?: string): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params: { cursor, limit: 50 } }).then((r) => r.data),

  sendMessage: (conversationId: string, content: string): Promise<{ message: ChatMessage }> =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }).then((r) => r.data),

  markAsRead: (conversationId: string): Promise<{ success: boolean }> =>
    api.patch(`/chat/conversations/${conversationId}/read`).then((r) => r.data),
};
