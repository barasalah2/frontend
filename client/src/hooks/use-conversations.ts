import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Conversation, type InsertConversation } from "@shared/schema";

export function useConversations(userId: string = "default_user", category?: string) {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", userId, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('user_id', userId);
      if (category) params.set('category', category);
      
      const response = await fetch(`/api/conversations?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversation: InsertConversation): Promise<Conversation> => {
      const response = await apiRequest("POST", "/api/conversations", conversation);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number): Promise<void> => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
  });

  return {
    conversations: conversations as Conversation[],
    isLoading,
    createConversation: createConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
  };
}
