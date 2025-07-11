import { ConversationInfo, ChatMessage } from './types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'workpacks_conversations',
  ACTIVE_CONVERSATION: 'workpacks_active_conversation',
  THEME: 'workpacks_theme'
};

export class LocalStorage {
  static getConversations(): ConversationInfo[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveConversations(conversations: ConversationInfo[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  static getActiveConversationId(): number | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      return stored ? parseInt(stored) : null;
    } catch {
      return null;
    }
  }

  static setActiveConversationId(id: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id.toString());
    } catch (error) {
      console.error('Failed to save active conversation:', error);
    }
  }

  static getMessagesForConversation(conversationId: number): ChatMessage[] {
    try {
      const key = `workpacks_messages_${conversationId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveMessagesForConversation(conversationId: number, messages: ChatMessage[]): void {
    try {
      const key = `workpacks_messages_${conversationId}`;
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }

  static clearConversation(conversationId: number): void {
    try {
      const key = `workpacks_messages_${conversationId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  }
}
