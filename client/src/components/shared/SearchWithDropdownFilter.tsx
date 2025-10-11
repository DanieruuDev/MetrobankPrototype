import React, { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchWithDropdownFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: {
    [key: string]: {
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
      label: string;
    };
  };
  className?: string;
}

const SearchWithDropdownFilter: React.FC<SearchWithDropdownFilterProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search by name or student ID...",
  filters,
  className = "",
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(filters).some(
    (filter) => filter.value !== "" && filter.value !== "All"
  );

  const clearAllFilters = () => {
    Object.values(filters).forEach((filter) => {
      filter.onChange("All");
    });
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-3 sm:p-4 ${className}`}>
      <div className="flex flex-row gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-between px-2 sm:px-3 py-3 lg:py-2.5 md:py-2.5 border border-gray-300 rounded-lg transition-colors text-sm min-w-[80px] sm:min-w-[120px] ${
              hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-800 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                  {
                    Object.values(filters).filter(
                      (f) => f.value !== "" && f.value !== "All"
                    ).length
                  }
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Filter Dropdown Content */}
          {showFilters && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] w-[280px] sm:w-auto sm:min-w-[280px]">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Filter Options */}
                {Object.entries(filters).map(([key, filter]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      {filter.label}
                    </label>
                    <select
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={clearAllFilters}
                      className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-800 py-1 sm:py-2 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchWithDropdownFilter;
