"use client";

import { X, Check } from "lucide-react";
import { Approver } from "../../../Interface/IWorkflow";

interface ChangeApproverModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedApprover: Approver | null;
  newApprover: string;
  setNewApprover: React.Dispatch<React.SetStateAction<string>>;
  reason: string;
  setReason: React.Dispatch<React.SetStateAction<string>>;
  handleChangeApprover: () => void;
}

export default function ChangeApproverModal({
  setShowModal,
  selectedApprover,
  newApprover,
  setNewApprover,
  reason,
  setReason,
  handleChangeApprover,
}: ChangeApproverModalProps) {
  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Change Approver</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Approver
              </label>
              <div className="bg-gray-100 p-3 rounded-lg text-gray-900">
                {selectedApprover?.approver_email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Approver Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter Email Address"
                value={newApprover}
                onChange={(e) => setNewApprover(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Change
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 transition-colors duration-200"
                placeholder="Please provide a reason for changing the approver..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
              onClick={handleChangeApprover}
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
