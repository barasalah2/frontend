import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { unifiedStorage, type StoredConversation, type StoredMessage, type StoredChart } from "@/lib/unified-storage";

interface ChatResponse {
  content: string;
  conv_id: number;
  data_array?: any[];
}

export function useUnifiedChat(conversationId: number | null) {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(conversationId);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Initialize storage migration and conversation setup
  useEffect(() => {
    if (!isInitialized) {
      // Migrate old storage format
      unifiedStorage.migrateFromOldStorage();
      
      // Ensure we have a default conversation
      const conversations = unifiedStorage.getConversations();
      if (conversations.length === 0) {
        const defaultConversation = unifiedStorage.createConversation({
          title: "Project Discussion",
          category: "general",
          userId: "default_user",
          metadata: { isDefault: true }
        });
        setCurrentConversationId(defaultConversation.id);
      } else if (!currentConversationId) {
        // Use the most recent conversation
        const mostRecent = conversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        setCurrentConversationId(mostRecent.id);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, currentConversationId]);

  // Update conversation ID when prop changes
  useEffect(() => {
    if (conversationId !== null && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId]);

  // Get conversation data
  const conversation = useMemo(() => {
    if (!currentConversationId) return null;
    return unifiedStorage.getConversation(currentConversationId);
  }, [currentConversationId]);

  // Get messages for current conversation
  const messages = useMemo(() => {
    if (!currentConversationId) return [];
    
    console.log('=== UNIFIED CHAT MESSAGES DEBUG ===');
    console.log('Current conversation ID:', currentConversationId);
    
    const storedMessages = unifiedStorage.getMessages(currentConversationId);
    const charts = unifiedStorage.getCharts(currentConversationId);
    
    console.log('Stored messages:', storedMessages.length);
    console.log('Charts found:', charts.length);
    
    // Convert charts to visualization messages
    const chartMessages: StoredMessage[] = charts.map(chart => {
      console.log('Converting chart to message:', chart.id, chart.title);
      return {
        id: `chart-${chart.id}`,
        conversationId: currentConversationId,
        content: chart.title || 'Saved Visualization',
        sender: "bot" as const,
        messageType: "visualization" as const,
        createdAt: chart.savedAt,
        data: {
          charts: chart.charts,
          originalData: chart.data,
          hasVisualization: true
        }
      };
    });

    console.log('Chart messages created:', chartMessages.length);

    // Combine and sort by creation time
    const allMessages = [...storedMessages, ...chartMessages];
    const sortedMessages = allMessages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    console.log('Final messages count:', sortedMessages.length);
    console.log('Message types:', sortedMessages.map(m => ({ id: m.id, type: m.messageType })));
    
    return sortedMessages;
  }, [currentConversationId]);

  // Get conversation title
  const conversationTitle = conversation?.title || "New Conversation";

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentConversationId) {
        throw new Error("No active conversation");
      }

      // Add user message to local storage
      const userMessage = unifiedStorage.addMessage(currentConversationId, {
        content: message,
        sender: "user",
        messageType: "text"
      });

      // Send to API
      const response = await apiRequest(`/api/genie`, {
        method: "POST",
        body: JSON.stringify({ message, conv_id: currentConversationId })
      });

      return { response, userMessage };
    },
    onSuccess: ({ response, userMessage }) => {
      if (!currentConversationId) return;

      // Add bot response to local storage
      const botMessage = unifiedStorage.addMessage(currentConversationId, {
        content: response.content,
        sender: "bot",
        messageType: response.data_array ? "table" : "text",
        data: response.data_array ? {
          table: response.data_array,
          hasVisualization: false,
          downloadable: true
        } : undefined
      });

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
        unifiedStorage.updateConversation(currentConversationId, { title });
      }

      console.log('Message sent and stored:', { userMessage, botMessage });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    }
  });

  // Save chart function
  const saveChart = useCallback(async (chartData: {
    title: string;
    charts: any[];
    data: any[];
    metadata?: any;
  }) => {
    if (!currentConversationId) {
      throw new Error("No active conversation");
    }

    // Save chart to unified storage
    const savedChart = unifiedStorage.addChart(currentConversationId, chartData);

    // Also save to backend for persistence
    try {
      await apiRequest(`/api/charts/save`, {
        method: "POST",
        body: JSON.stringify({
          conv_id: currentConversationId,
          title: chartData.title,
          charts: chartData.charts,
          data: chartData.data,
          metadata: chartData.metadata
        })
      });
      console.log('Chart saved to backend:', savedChart.id);
    } catch (error) {
      console.error('Failed to save chart to backend:', error);
    }

    return savedChart;
  }, [currentConversationId]);

  // Delete chart function
  const deleteChart = useCallback((chartId: number) => {
    if (!currentConversationId) return false;
    return unifiedStorage.deleteChart(currentConversationId, chartId);
  }, [currentConversationId]);

  // Get all charts for current conversation
  const charts = useMemo(() => {
    if (!currentConversationId) return [];
    return unifiedStorage.getCharts(currentConversationId);
  }, [currentConversationId]);

  // Create new conversation
  const createConversation = useCallback((title: string, category: string = "general") => {
    const newConversation = unifiedStorage.createConversation({
      title,
      category,
      userId: "default_user",
      metadata: { createdFromChat: true }
    });
    setCurrentConversationId(newConversation.id);
    return newConversation;
  }, []);

  // Update conversation
  const updateConversation = useCallback((updates: Partial<StoredConversation>) => {
    if (!currentConversationId) return null;
    return unifiedStorage.updateConversation(currentConversationId, updates);
  }, [currentConversationId]);

  // Delete conversation
  const deleteConversation = useCallback(() => {
    if (!currentConversationId) return false;
    const success = unifiedStorage.deleteConversation(currentConversationId);
    if (success) {
      setCurrentConversationId(null);
    }
    return success;
  }, [currentConversationId]);

  return {
    // State
    currentConversationId,
    conversationTitle,
    conversation,
    messages,
    charts,
    isInitialized,
    
    // Actions
    sendMessage: sendMessageMutation.mutateAsync,
    saveChart,
    deleteChart,
    createConversation,
    updateConversation,
    deleteConversation,
    
    // Status
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error
  };
}

// Hook for managing all conversations
export function useConversationList() {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = () => {
      setIsLoading(true);
      try {
        const allConversations = unifiedStorage.getConversations();
        setConversations(allConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
    
    // Set up interval to refresh conversations
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const createConversation = useCallback((title: string, category: string = "general") => {
    const newConversation = unifiedStorage.createConversation({
      title,
      category,
      userId: "default_user"
    });
    setConversations(prev => [...prev, newConversation]);
    return newConversation;
  }, []);

  const deleteConversation = useCallback((id: number) => {
    const success = unifiedStorage.deleteConversation(id);
    if (success) {
      setConversations(prev => prev.filter(conv => conv.id !== id));
    }
    return success;
  }, []);

  return {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    refresh: () => setConversations(unifiedStorage.getConversations())
  };
}