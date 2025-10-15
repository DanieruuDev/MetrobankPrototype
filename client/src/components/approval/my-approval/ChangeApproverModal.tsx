"use client";

import { X, Check } from "lucide-react";
import { Approver } from "../../../Interface/IWorkflow";
import { useState, useRef, useEffect } from "react";

interface EmailSuggestion {
  email: string;
  role: string;
}

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
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Fetch email suggestions
  const fetchEmailSuggestions = async (query: string) => {
    // Only show suggestions if user has typed at least one character
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const url =
        query.trim() === ""
          ? `${VITE_BACKEND_URL}api/workflow/search-email-role`
          : `${VITE_BACKEND_URL}api/workflow/search-email-role/${encodeURIComponent(
              query
            )}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error("Error fetching email suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle email input change with debouncing
  const handleEmailChange = (value: string) => {
    setNewApprover(value);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = window.setTimeout(() => {
      fetchEmailSuggestions(value);
    }, 150);
  };

  // Handle keyboard navigation
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, suggestions.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (
          selectedSuggestionIndex >= 0 &&
          selectedSuggestionIndex < suggestions.length
        ) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: EmailSuggestion) => {
    setNewApprover(suggestion.email);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Approver Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Type to search emails..."
                  value={newApprover}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onFocus={() => {
                    // Only show suggestions if user has already typed something
                    if (newApprover.length >= 1) {
                      fetchEmailSuggestions(newApprover);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow for click selection
                    setTimeout(() => {
                      setShowSuggestions(false);
                    }, 200);
                  }}
                  autoComplete="off"
                />
                {isLoadingSuggestions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown - positioned absolutely within modal */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto z-50">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.email}-${index}`}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                          selectedSuggestionIndex === index ? "bg-blue-100" : ""
                        }`}
                        onClick={() => selectSuggestion(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <div className="font-medium text-gray-900">
                          {suggestion.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          {suggestion.role}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No matching accounts found
                    </div>
                  )}
                </div>
              )}
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
