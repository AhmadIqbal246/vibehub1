// // Pagination constants
// export const PAGINATION_CONSTANTS = {
//   MESSAGES_PER_PAGE: 50,
//   CONVERSATIONS_PER_PAGE: 20,
//   USERS_PER_PAGE: 30,
//   MAX_VISIBLE_PAGES: 5
// };

// // Utility function to calculate pagination info
// export const calculatePaginationRange = (currentPage, totalPages, maxVisible = 5) => {
//   if (totalPages <= maxVisible) {
//     // If total pages is less than max visible, show all pages
//     return Array.from({ length: totalPages }, (_, i) => i + 1);
//   }

//   const halfVisible = Math.floor(maxVisible / 2);
//   let startPage = Math.max(currentPage - halfVisible, 1);
//   let endPage = Math.min(startPage + maxVisible - 1, totalPages);

//   // Adjust start page if we're near the end
//   if (endPage - startPage + 1 < maxVisible) {
//     startPage = Math.max(endPage - maxVisible + 1, 1);
//   }

//   return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
// };

// // Format pagination text
// export const getPaginationText = (currentPage, totalPages, totalItems, itemType = 'items') => {
//   if (totalItems === 0) {
//     return `No ${itemType} found`;
//   }
  
//   if (totalPages === 1) {
//     return `Showing all ${totalItems} ${itemType}`;
//   }
  
//   return `Page ${currentPage} of ${totalPages} (${totalItems} ${itemType} total)`;
// };

// // Calculate items range for current page
// export const getItemsRange = (currentPage, pageSize, totalItems) => {
//   const start = (currentPage - 1) * pageSize + 1;
//   const end = Math.min(currentPage * pageSize, totalItems);
//   return { start, end };
// };
