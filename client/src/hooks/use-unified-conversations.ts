import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { unifiedStorage, type StoredConversation } from "@/lib/unified-storage";

export type ConversationCategory = 
  | "general"
  | "project-planning" 
  | "cwa-analysis"
  | "scheduling"
  | "resource-planning";

export interface ConversationListItem {
  id: number;
  title: string;
  category: ConversationCategory;
  preview: string;
  messageCount: number;
  chartCount: number;
  timestamp: string;
  isActive?: boolean;
}

export function useUnifiedConversations(userId: string = "default_user", category?: ConversationCategory) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Load conversations from unified storage
  const loadConversations = useCallback(() => {
    setIsLoading(true);
    try {
      const storedConversations = unifiedStorage.getConversations();
      
      // Filter by category if specified
      const filteredConversations = category 
        ? storedConversations.filter(conv => conv.category === category)
        : storedConversations;

      // Convert to list format
      const conversationList: ConversationListItem[] = filteredConversations.map(conv => {
        const lastMessage = conv.messages[conv.messages.length - 1];
        const preview = lastMessage?.content || "No messages yet";
        
        return {
          id: conv.id,
          title: conv.title,
          category: conv.category as ConversationCategory,
          preview: preview.length > 100 ? preview.substring(0, 100) + "..." : preview,
          messageCount: conv.messages.length,
          chartCount: conv.charts.length,
          timestamp: conv.updatedAt,
          isActive: false
        };
      });

      // Sort by last updated
      conversationList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setConversations(conversationList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData: {
      title: string;
      category: ConversationCategory;
      initialMessage?: string;
    }) => {
      const newConversation = unifiedStorage.createConversation({
        title: conversationData.title,
        category: conversationData.category,
        userId,
        metadata: { createdFromList: true }
      });

      // Add initial message if provided
      if (conversationData.initialMessage) {
        unifiedStorage.addMessage(newConversation.id, {
          content: conversationData.initialMessage,
          sender: "user",
          messageType: "text"
        });
      }

      // Try to sync with backend
      try {
        await apiRequest(`/api/conversations`, {
          method: "POST",
          body: JSON.stringify({
            title: conversationData.title,
            category: conversationData.category,
            userId
          })
        });
      } catch (error) {
        console.warn('Failed to sync conversation with backend:', error);
      }

      return newConversation;
    },
    onSuccess: () => {
      loadConversations();
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const success = unifiedStorage.deleteConversation(conversationId);
      if (!success) {
        throw new Error('Failed to delete conversation');
      }
      return conversationId;
    },
    onSuccess: () => {
      loadConversations();
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    }
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<StoredConversation> }) => {
      const updated = unifiedStorage.updateConversation(data.id, data.updates);
      if (!updated) {
        throw new Error('Failed to update conversation');
      }
      return updated;
    },
    onSuccess: () => {
      loadConversations();
    },
    onError: (error) => {
      console.error('Failed to update conversation:', error);
    }
  });

  // Get conversations by category
  const getConversationsByCategory = useCallback((category: ConversationCategory) => {
    return conversations.filter(conv => conv.category === category);
  }, [conversations]);

  // Get conversation statistics
  const statistics = useMemo(() => {
    const total = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
    const totalCharts = conversations.reduce((sum, conv) => sum + conv.chartCount, 0);
    
    const byCategory = conversations.reduce((acc, conv) => {
      acc[conv.category] = (acc[conv.category] || 0) + 1;
      return acc;
    }, {} as Record<ConversationCategory, number>);

    return {
      total,
      totalMessages,
      totalCharts,
      byCategory
    };
  }, [conversations]);

  // Search conversations
  const searchConversations = useCallback((query: string) => {
    if (!query.trim()) return conversations;
    
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.preview.toLowerCase().includes(lowerQuery) ||
      conv.category.toLowerCase().includes(lowerQuery)
    );
  }, [conversations]);

  return {
    // Data
    conversations,
    statistics,
    
    // Loading states
    isLoading,
    isCreating: createConversationMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
    isUpdating: updateConversationMutation.isPending,
    
    // Actions
    createConversation: createConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    
    // Utilities
    getConversationsByCategory,
    searchConversations,
    refreshConversations: loadConversations,
    
    // Errors
    error: createConversationMutation.error || deleteConversationMutation.error || updateConversationMutation.error
  };
}

// Hook for managing conversation categories
export function useConversationCategories() {
  const categories: { value: ConversationCategory; label: string; description: string }[] = [
    { value: "general", label: "General", description: "General discussions and queries" },
    { value: "project-planning", label: "Project Planning", description: "Project planning and strategy" },
    { value: "cwa-analysis", label: "CWA Analysis", description: "Contract Work Authorization analysis" },
    { value: "scheduling", label: "Scheduling", description: "Schedule planning and management" },
    { value: "resource-planning", label: "Resource Planning", description: "Resource allocation and planning" }
  ];

  const getCategoryInfo = useCallback((category: ConversationCategory) => {
    return categories.find(cat => cat.value === category) || categories[0];
  }, []);

  return {
    categories,
    getCategoryInfo
  };
}