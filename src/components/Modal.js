import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, type = 'success', title, message, onConfirm, confirmText = 'OK', cancelText = 'Cancel', showCancel = false }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500 text-6xl mb-4" />;
      case 'error':
        return <FaTimesCircle className="text-red-500 text-6xl mb-4" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500 text-6xl mb-4" />;
      default:
        return <FaCheckCircle className="text-green-500 text-6xl mb-4" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-green-500';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-green-600 hover:bg-green-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-t-4 ${getBorderColor()} animate-scale-in`}>
        <div className="flex flex-col items-center text-center">
          {getIcon()}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-lg mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm || onClose}
              className={`flex-1 ${getButtonColor()} text-white py-3 rounded-lg font-semibold transition`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
