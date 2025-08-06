import { useState, useCallback } from 'react';

export const usePagination = (initialPageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);

  const updatePaginationData = useCallback((paginationData) => {
    setCurrentPage(paginationData.page);
    setPageSize(paginationData.page_size);
    setTotalItems(paginationData.total_messages || paginationData.total_conversations || 0);
    setTotalPages(paginationData.total_pages);
    setHasNext(paginationData.has_next);
    setHasPrevious(paginationData.has_previous);
  }, []);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      return true;
    }
    return false;
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
      return true;
    }
    return false;
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage(prev => prev - 1);
      return true;
    }
    return false;
  }, [hasPrevious]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(0);
    setHasNext(false);
    setHasPrevious(false);
  }, []);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNext,
    hasPrevious,
    loading,
    setLoading,
    setPageSize,
    updatePaginationData,
    goToPage,
    nextPage,
    previousPage,
    reset
  };
};

export default usePagination;
