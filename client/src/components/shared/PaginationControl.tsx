import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const createPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
        if (totalPages > 3) pages.push("...");
      } else if (currentPage >= totalPages - 1) {
        if (totalPages > 3) pages.push(1, "...");
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center gap-1 py-3 text-gray-700">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 font-medium cursor-pointer text-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1 mx-1 sm:mx-2">
        {createPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-2 sm:px-3 py-1 min-w-[28px] sm:min-w-[32px] rounded cursor-pointer text-sm ${
                page === currentPage
                  ? "bg-blue-600 text-white font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-1 select-none text-sm">
              {page}
            </span>
          )
        )}
      </div>

      <button
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50 font-medium cursor-pointer text-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PaginationControl;
