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

  // Loading state for approver change
  const [isChangingApprover, setIsChangingApprover] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Handle approver change with loading effect
  const handleChangeApproverWithLoading = async () => {
    if (!newApprover.trim() || !reason.trim()) {
      return;
    }

    setIsChangingApprover(true);
    setProgress(0);

    // Start progress animation (like RenewalListV2)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95; // Stop at 95% until operation completes
        }
        return prev + 1;
      });
    }, 30); // Update every 30ms for smooth animation

    try {
      // Call the original handler
      await handleChangeApprover();

      // Complete the progress
      setProgress(100);

      // Wait longer to show 100% completion
      setTimeout(() => {
        setIsChangingApprover(false);
        setShowModal(false);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsChangingApprover(false);
      setProgress(0);
      console.error("Error changing approver:", error);
    }
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
    <div>
      {/* Full Screen Loading Overlay with Circular Progress */}
      {isChangingApprover && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-32 h-32 mb-6">
                {/* Animated Background Circle */}
                <svg
                  className="w-32 h-32 transform -rotate-90 animate-pulse"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                    className="animate-pulse"
                  />
                  {/* Progress Circle with Animation */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 50 * (1 - progress / 100)
                    }`}
                    className="transition-all duration-300 ease-out animate-pulse"
                  />
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Percentage Text Inside Circle with Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center animate-bounce">
                    <div className="text-3xl font-bold text-green-600 animate-pulse">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1 animate-pulse">
                      Complete
                    </div>
                  </div>
                </div>

                {/* Rotating Ring Animation */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-300 animate-spin opacity-30"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Changing Approver
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Updating approval workflow...
              </p>

              {/* Enhanced Email Display - More Visible */}
              <div className="w-full space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Current Approver:
                  </div>
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {selectedApprover?.approver_email}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    New Approver:
                  </div>
                  <div className="text-sm font-semibold text-green-800 truncate">
                    {newApprover}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Please do not close this window
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Change Approver
              </h2>
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
                            selectedSuggestionIndex === index
                              ? "bg-blue-100"
                              : ""
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
                onClick={handleChangeApproverWithLoading}
                disabled={!newApprover.trim() || !reason.trim()}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
