import { type Message } from "@shared/schema";

// Unified storage interface for conversations, messages, and charts
export interface StoredConversation {
  id: number;
  title: string;
  category: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  messages: StoredMessage[];
  charts: StoredChart[];
}

export interface StoredMessage {
  id: number | string;
  conversationId: number;
  content: string;
  sender: "user" | "bot";
  messageType?: "text" | "visualization" | "table" | "report";
  createdAt: string;
  data?: {
    table?: any[];
    charts?: any[];
    originalData?: any[];
    headers?: string[];
    hasVisualization?: boolean;
    downloadable?: boolean;
  };
}

export interface StoredChart {
  id: number;
  conversationId: number;
  messageId?: number | string;
  title: string;
  charts: any[];
  data: any[];
  savedAt: string;
  metadata?: any;
}

class UnifiedStorage {
  private STORAGE_KEYS = {
    CONVERSATIONS: 'workpacks_conversations_unified',
    ACTIVE_CONVERSATION: 'workpacks_active_conversation',
    THEME: 'workpacks_theme',
    USER_PREFERENCES: 'workpacks_user_preferences'
  };

  // Conversation operations
  getConversations(): StoredConversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  saveConversations(conversations: StoredConversation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      console.log('Saved conversations:', conversations.length);
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  getConversation(id: number): StoredConversation | null {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  createConversation(conversation: Omit<StoredConversation, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'charts'>): StoredConversation {
    const conversations = this.getConversations();
    const newId = Math.max(0, ...conversations.map(c => c.id)) + 1;
    
    const newConversation: StoredConversation = {
      ...conversation,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      charts: []
    };

    conversations.push(newConversation);
    this.saveConversations(conversations);
    return newConversation;
  }

  updateConversation(id: number, updates: Partial<StoredConversation>): StoredConversation | null {
    const conversations = this.getConversations();
    const index = conversations.findIndex(conv => conv.id === id);
    
    if (index === -1) return null;

    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveConversations(conversations);
    return conversations[index];
  }

  deleteConversation(id: number): boolean {
    const conversations = this.getConversations();
    const filteredConversations = conversations.filter(conv => conv.id !== id);
    
    if (filteredConversations.length === conversations.length) {
      return false; // No conversation found
    }

    this.saveConversations(filteredConversations);
    return true;
  }

  // Message operations
  getMessages(conversationId: number): StoredMessage[] {
    const conversation = this.getConversation(conversationId);
    return conversation?.messages || [];
  }

  addMessage(conversationId: number, message: Omit<StoredMessage, 'id' | 'createdAt' | 'conversationId'>): StoredMessage {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: StoredMessage = {
      ...message,
      id: newMessageId,
      conversationId,
      createdAt: new Date().toISOString()
    };

    conversations[convIndex].messages.push(newMessage);
    conversations[convIndex].updatedAt = new Date().toISOString();
    
    this.saveConversations(conversations);
    return newMessage;
  }

  updateMessage(conversationId: number, messageId: number | string, updates: Partial<StoredMessage>): StoredMessage | null {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex === -1) return null;

    const msgIndex = conversations[convIndex].messages.findIndex(msg => msg.id === messageId);
    if (msgIndex === -1) return null;

    conversations[convIndex].messages[msgIndex] = {
      ...conversations[convIndex].messages[msgIndex],
      ...updates
    };

    conversations[convIndex].updatedAt = new Date().toISOString();
    this.saveConversations(conversations);
    return conversations[convIndex].messages[msgIndex];
  }

  deleteMessage(conversationId: number, messageId: number | string): boolean {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex === -1) return false;

    const initialLength = conversations[convIndex].messages.length;
    conversations[convIndex].messages = conversations[convIndex].messages.filter(msg => msg.id !== messageId);
    
    if (conversations[convIndex].messages.length === initialLength) {
      return false; // No message found
    }

    conversations[convIndex].updatedAt = new Date().toISOString();
    this.saveConversations(conversations);
    return true;
  }

  // Chart operations
  getCharts(conversationId: number): StoredChart[] {
    const conversation = this.getConversation(conversationId);
    return conversation?.charts || [];
  }

  addChart(conversationId: number, chart: Omit<StoredChart, 'id' | 'savedAt' | 'conversationId'>): StoredChart {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newChartId = Date.now();
    const newChart: StoredChart = {
      ...chart,
      id: newChartId,
      conversationId,
      savedAt: new Date().toISOString()
    };

    conversations[convIndex].charts.push(newChart);
    conversations[convIndex].updatedAt = new Date().toISOString();
    
    this.saveConversations(conversations);
    console.log('Added chart to conversation', conversationId, '- total charts:', conversations[convIndex].charts.length);
    return newChart;
  }

  getAllCharts(): StoredChart[] {
    const conversations = this.getConversations();
    return conversations.flatMap(conv => conv.charts);
  }

  deleteChart(conversationId: number, chartId: number): boolean {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (convIndex === -1) return false;

    const initialLength = conversations[convIndex].charts.length;
    conversations[convIndex].charts = conversations[convIndex].charts.filter(chart => chart.id !== chartId);
    
    if (conversations[convIndex].charts.length === initialLength) {
      return false; // No chart found
    }

    conversations[convIndex].updatedAt = new Date().toISOString();
    this.saveConversations(conversations);
    return true;
  }

  // Active conversation management
  getActiveConversationId(): number | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION);
      return stored ? parseInt(stored) : null;
    } catch {
      return null;
    }
  }

  setActiveConversationId(id: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION, id.toString());
    } catch (error) {
      console.error('Failed to save active conversation:', error);
    }
  }

  // Migration from old storage format
  migrateFromOldStorage(): void {
    try {
      // Check if we need to migrate
      const oldConversations = localStorage.getItem('workpacks_conversations');
      const oldCharts = localStorage.getItem('savedCharts');
      
      if (!oldConversations && !oldCharts) {
        console.log('No old storage found, skipping migration');
        return;
      }

      console.log('Migrating from old storage format...');
      
      const conversations = this.getConversations();
      let migrationNeeded = false;

      // Migrate old conversations
      if (oldConversations) {
        const oldConvs = JSON.parse(oldConversations);
        oldConvs.forEach((oldConv: any) => {
          const existingConv = conversations.find(c => c.id === oldConv.id);
          if (!existingConv) {
            const newConv: StoredConversation = {
              id: oldConv.id,
              title: oldConv.title,
              category: oldConv.category,
              userId: "default_user",
              createdAt: oldConv.timestamp || new Date().toISOString(),
              updatedAt: oldConv.timestamp || new Date().toISOString(),
              metadata: oldConv.metadata || null,
              messages: [],
              charts: []
            };
            conversations.push(newConv);
            migrationNeeded = true;
          }
        });
      }

      // Migrate old charts
      if (oldCharts) {
        const oldChartsList = JSON.parse(oldCharts);
        oldChartsList.forEach((oldChart: any) => {
          const convIndex = conversations.findIndex(c => c.id === oldChart.conversationId);
          if (convIndex !== -1) {
            const existingChart = conversations[convIndex].charts.find(c => c.id === oldChart.id);
            if (!existingChart) {
              const newChart: StoredChart = {
                id: oldChart.id,
                conversationId: oldChart.conversationId,
                title: oldChart.title || 'Migrated Chart',
                charts: oldChart.charts || [],
                data: oldChart.data || [],
                savedAt: oldChart.savedAt || new Date().toISOString(),
                metadata: oldChart.metadata || null
              };
              conversations[convIndex].charts.push(newChart);
              migrationNeeded = true;
            }
          }
        });
      }

      if (migrationNeeded) {
        this.saveConversations(conversations);
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  // Debug utilities
  exportAllData(): string {
    const conversations = this.getConversations();
    return JSON.stringify(conversations, null, 2);
  }

  importAllData(data: string): boolean {
    try {
      const conversations = JSON.parse(data);
      this.saveConversations(conversations);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(this.STORAGE_KEYS.ACTIVE_CONVERSATION);
    console.log('All data cleared');
  }
}

export const unifiedStorage = new UnifiedStorage();