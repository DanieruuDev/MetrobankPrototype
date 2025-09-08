import React, { useEffect, useState } from "react";
import ApproverTable, {
  Approvers,
} from "../../components/approval/ApproverTable";
import { ApproverInfo } from "../../Interface/IWorkflow";
import { Approver } from "../../pages/Workflow/Workflow";
import Loading2 from "../shared/Loading2";

interface ApproverSectionProps {
  title: string;
  iconColor: string;
  bgColor: string;
  items: (ApproverInfo & Approvers)[];
  onRowClick: (row: Approver) => void;
  emptyMessage: {
    heading: string;
    description: string;
  };
  isRequestLoading: boolean;
}

const ApproverSection: React.FC<ApproverSectionProps> = ({
  title,
  iconColor,
  bgColor,
  items,
  onRowClick,
  emptyMessage,
  isRequestLoading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (isModalOpen) {
      // Disable scrolling
      document.body.style.overflow = "hidden";
    } else {
      // Enable scrolling
      document.body.style.overflow = "auto";
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Main Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden my-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}
            >
              <svg
                className={`w-4 h-4 ${iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <span
              className={`px-2 py-1 ${bgColor} text-xs font-medium rounded-full`}
            >
              {items.length} items
            </span>
          </div>

          {/* View All Button */}
          {items.length > 10 && (
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsModalOpen(true)}
            >
              View All
            </button>
          )}
        </div>

        {!isRequestLoading ? (
          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {emptyMessage.heading}
                </h3>
                <p className="text-gray-500">{emptyMessage.description}</p>
              </div>
            ) : (
              <ApproverTable
                approvers={items.slice(0, 10)}
                section={
                  title === "Completed"
                    ? "Completed"
                    : title === "Canceled"
                    ? "Canceled"
                    : "Other"
                }
                onRowClick={(id) => onRowClick({ approver_id: id } as Approver)}
              />
            )}
          </div>
        ) : (
          <div className="py-4">
            <Loading2 />
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)]  flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-[90%] max-w-5xl  overflow-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ApproverTable
                approvers={items} // show all
                onRowClick={(id) => onRowClick({ approver_id: id } as Approver)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApproverSection;
