import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Message } from "@shared/schema";

interface ChatResponse {
  content: string;
  conv_id: number;
  data_array?: any[];
}

export function useChat(conversationId: number | null) {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(conversationId);
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [localStorageKey, setLocalStorageKey] = useState(0); // Force re-render trigger
  const queryClient = useQueryClient();

  // Initialize conversationId properly
  useEffect(() => {
    if (conversationId !== null && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      setLocalStorageKey(prev => prev + 1);
    }
  }, [conversationId, currentConversationId]);

  // Fetch messages for the current conversation
  const { data: apiMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

  // Merge API messages with local storage saved charts
  const messages = useMemo(() => {
    console.log('=== REBUILDING MESSAGES LIST ===');
    console.log('CurrentConversationId:', currentConversationId);
    console.log('API Messages count:', apiMessages.length);
    console.log('LocalStorageKey (trigger):', localStorageKey);
    
    if (!currentConversationId) {
      console.log('No conversation ID, returning empty array');
      return [];
    }
    
    try {
      const savedChartsJson = localStorage.getItem('savedCharts');
      console.log('Raw savedCharts from localStorage:', savedChartsJson);
      
      if (!savedChartsJson) {
        console.log('No saved charts found, returning API messages only');
        return apiMessages;
      }
      
      const savedCharts = JSON.parse(savedChartsJson);
      console.log('Parsed savedCharts:', savedCharts);
      
      const conversationCharts = savedCharts.filter((chart: any) => {
        console.log(`Checking chart ${chart.id}: conversationId=${chart.conversationId} vs current=${currentConversationId}`);
        return chart.conversationId === currentConversationId;
      });
      console.log('Charts for conversation', currentConversationId, ':', conversationCharts);
      
      if (conversationCharts.length === 0) {
        console.log('No charts for this conversation, returning API messages only');
        return apiMessages;
      }
      
      // Convert saved charts to message format
      const chartMessages = conversationCharts.map((chart: any) => {
        const chartMessage = {
          id: `chart-${chart.id}`, // Ensure unique IDs
          conversationId: currentConversationId,
          content: chart.title || 'Saved Visualization',
          sender: "bot" as const,
          messageType: "visualization" as const,
          data: {
            charts: chart.charts,
            originalData: chart.data,
            title: chart.title || 'Saved Visualization',
            savedAt: chart.savedAt
          },
          createdAt: new Date(chart.savedAt)
        };
        console.log('Created chart message:', chartMessage);
        return chartMessage;
      });

      console.log('Chart messages created:', chartMessages.length);

      // Combine and sort by creation time
      const allMessages = [...apiMessages, ...chartMessages];
      const sortedMessages = allMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      console.log('Final sorted messages count:', sortedMessages.length);
      console.log('Final messages:', sortedMessages.map(m => ({ id: m.id, type: m.messageType || 'text', content: m.content.substring(0, 50) })));
      return sortedMessages;
    } catch (error) {
      console.error('Error loading saved charts:', error);
      return apiMessages;
    }
  }, [apiMessages, currentConversationId, localStorageKey]);

  // Trigger refresh when conversation changes
  useEffect(() => {
    setLocalStorageKey(prev => prev + 1);
  }, [currentConversationId]);

  // Also trigger refresh when API messages are loaded to ensure saved charts are merged
  useEffect(() => {
    if (apiMessages.length > 0) {
      setLocalStorageKey(prev => prev + 1);
    }
  }, [apiMessages.length]);

  // Force refresh on initial load to ensure charts are loaded
  useEffect(() => {
    if (currentConversationId) {
      // Small delay to ensure localStorage is ready
      setTimeout(() => {
        setLocalStorageKey(prev => prev + 1);
      }, 100);
    }
  }, [currentConversationId]);

  // Force refresh every second for testing (temporary)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentConversationId) {
        console.log('Forcing periodic refresh for conversation:', currentConversationId);
        
        // Debug localStorage content
        const savedCharts = localStorage.getItem('savedCharts');
        if (savedCharts) {
          try {
            const parsed = JSON.parse(savedCharts);
            console.log('Periodic check - total charts:', parsed.length);
            const forConversation = parsed.filter((chart: any) => chart.conversationId === currentConversationId);
            console.log('Periodic check - charts for this conversation:', forConversation.length);
          } catch (e) {
            console.error('Error parsing saved charts:', e);
          }
        }
        
        setLocalStorageKey(prev => prev + 1);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentConversationId]);

  // Add storage event listener to refresh when charts are saved
  useEffect(() => {
    const handleStorageChange = () => {
      // Force re-render by updating state
      setLocalStorageKey(prev => prev + 1);
    };

    // Use custom event instead of storage event for same-window updates
    const handleChartSaved = () => {
      setLocalStorageKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chartSaved', handleChartSaved);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chartSaved', handleChartSaved);
    };
  }, []);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (question: string): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/genie", {
        question,
        conv_id: currentConversationId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update conversation ID if new conversation was created
      if (data.conv_id && data.conv_id !== currentConversationId) {
        setCurrentConversationId(data.conv_id);
      }
      
      // Invalidate and refetch messages
      if (data.conv_id) {
        queryClient.invalidateQueries({
          queryKey: ["/api/conversations", data.conv_id, "messages"]
        });
        // Also trigger a localStorage refresh by forcing re-render
        window.dispatchEvent(new Event('chartSaved'));
      }
      
      // Invalidate conversations list to update recent conversations
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  const sendMessage = useCallback(async (message: string) => {
    try {
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [sendMessageMutation]);

  const loadConversation = useCallback((conversationId: number) => {
    setCurrentConversationId(conversationId);
    // Force a refresh of localStorage charts when loading a conversation
    setLocalStorageKey(prev => prev + 1);
    // The query will automatically refetch when conversationId changes
  }, []);

  return {
    messages: messages as Message[],
    isLoading: messagesLoading || sendMessageMutation.isPending,
    sendMessage,
    loadConversation,
    currentConversationId,
    conversationTitle,
  };
}
