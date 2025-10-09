import { Plus, Search } from "lucide-react";

interface MyApprovalControlProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isModal: boolean;
  setIsModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MyApprovalControl({
  searchQuery,
  setSearchQuery,
  isModal,
  setIsModal,
}: MyApprovalControlProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f61c0] focus:border-transparent transition-all"
        />
        <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 absolute left-2 sm:left-3 top-2 sm:top-2.5 pointer-events-none" />
      </div>

      {/* Create Approval Button */}
      <button
        onClick={() => setIsModal(!isModal)}
        className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-[#0f61c0] rounded-lg shadow-sm hover:bg-[#0d4ea3] transition-all duration-200 cursor-pointer flex-shrink-0"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">Create Approval</span>
        <span className="xs:hidden">Create</span>
      </button>
    </div>
  );
}
