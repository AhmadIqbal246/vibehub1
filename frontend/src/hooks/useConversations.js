import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosConfig';
import ENV from '../config';

// API functions
const fetchConversations = async ({ pageParam = 1, pageSize = 8 }) => {
  const response = await axiosInstance.get(
    `${ENV.BASE_API_URL}/chat/api/conversations/?page=${pageParam}&page_size=${pageSize}`
  );
  return response.data;
};

const deleteConversation = async (conversationId) => {
  const response = await axiosInstance.delete(
    `${ENV.BASE_API_URL}/chat/api/conversation/${conversationId}/delete/`
  );
  return response.data;
};

// Custom hooks - Using useInfiniteQuery for proper Load More functionality
export const useConversations = (pageSize = 8) => {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1 }) => fetchConversations({ pageParam, pageSize }),
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, otherwise undefined
      return lastPage.pagination?.has_next ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 30000, // Consider fresh for 30 seconds
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      // Invalidate and refetch conversations after successful deletion
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    },
  });
};

// Export query keys for external use (useful for manual invalidation)
export const conversationKeys = {
  all: ['conversations'],
  lists: () => [...conversationKeys.all, 'list'],
  list: (page, pageSize) => [...conversationKeys.lists(), page, pageSize],
};
