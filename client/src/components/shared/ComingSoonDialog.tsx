import React, { useState } from "react";

function ComingSoonDialog({ triggerText = "Click Me", buttonClassName = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        className={`bg-blue-600 hover:bg-blue-700 hover:text-white text-blue font-medium py-2 px-4 rounded-lg transition-colors ${buttonClassName}`}
      >
        {triggerText}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Notice</h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <div className="mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                This feature is currently under development and will be
                available soon.
              </p>
              <button
                onClick={closeModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ComingSoonDialog;
