import React from 'react';
import { FaHome } from 'react-icons/fa';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
          <FaHome className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary text-2xl" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
