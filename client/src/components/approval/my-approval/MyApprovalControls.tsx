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
    <div className="flex flex-wrap items-center gap-2">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f61c0] focus:border-transparent transition-all"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* Create Approval Button */}
      <button
        onClick={() => setIsModal(!isModal)}
        className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-[#0f61c0] rounded-lg shadow-sm hover:bg-[#0d4ea3] transition-all duration-200 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Create Approval
      </button>
    </div>
  );
}
