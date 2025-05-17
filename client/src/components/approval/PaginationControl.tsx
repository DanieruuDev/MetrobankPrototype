import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Add these two lines to the interface:
  isPreviousDisabled?: boolean; // Optional boolean prop to disable the previous button
  isNextDisabled?: boolean; // Optional boolean prop to disable the next button
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  // Destructure the new props here:
  isPreviousDisabled = false, // Provide a default value
  isNextDisabled = false, // Provide a default value
}) => {
  const createPageNumbers = () => {
    const pages = [];

    // Simplified logic for displaying page numbers (adjust if needed)
    if (totalPages <= 5) {
      // Display all pages if 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis if current page is far from the start
      if (currentPage > 3) {
        pages.push("...");
      }

      // Show current page and its immediate neighbors
      if (currentPage > 2 && currentPage < totalPages - 1) {
        pages.push(currentPage - 1);
      }
      if (currentPage > 1 && currentPage < totalPages) {
        pages.push(currentPage);
      }
      if (currentPage > 2 && currentPage < totalPages - 1) {
        pages.push(currentPage + 1);
      }

      // Show ellipsis if current page is far from the end
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        // Only push totalPages if there's more than 1 page
        pages.push(totalPages);
      }

      // Remove duplicates and ensure correct order
      const uniquePages = Array.from(new Set(pages));
      const sortedPages = uniquePages.sort((a, b) => {
        if (a === "...") return b === "..." ? 0 : -1;
        if (b === "...") return 1;
        return (a as number) - (b as number);
      });
      return sortedPages;
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8 text-gray-700">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        // Use the isPreviousDisabled prop
        disabled={isPreviousDisabled}
        className="flex items-center gap-1 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 font-medium cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1 mx-2">
        {createPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index} // Using index as key is acceptable here as the page numbers are derived from state
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 min-w-[32px] rounded cursor-pointer ${
                page === currentPage
                  ? "bg-blue-600 text-white font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-1">
              {page}
            </span>
          )
        )}
      </div>

      <button
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        // Use the isNextDisabled prop
        disabled={isNextDisabled}
        className="flex items-center gap-1 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 font-medium cursor-pointer   "
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PaginationControl;
