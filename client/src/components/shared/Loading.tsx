import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center p-8 w-full">
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <div className="relative">
          <div className="absolute -inset-2 rounded-full border-2 border-[#023184] border-t-transparent animate-spin"></div>
          <div className="h-16 w-16 flex items-center justify-center rounded-md">
            <img
              src="/mb-logo.png"
              alt="Metrobank"
              className="h-10 w-10 object-contain"
            />
          </div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
