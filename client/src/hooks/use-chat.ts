import { useState, useCallback } from "react";
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
  const queryClient = useQueryClient();

  // Fetch messages for the current conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

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
