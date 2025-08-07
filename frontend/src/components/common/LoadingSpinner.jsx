import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component that can be used throughout the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg') - default: 'md'
 * @param {string} props.message - Loading message to display - default: 'Loading...'
 * @param {boolean} props.fullScreen - Whether to show full screen loading - default: false
 * @param {string} props.className - Additional CSS classes
 */
const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false, 
  className = '' 
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-16 w-16 border-4',
    lg: 'h-24 w-24 border-4'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const spinner = (
    <div className={`text-center ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500 border-t-transparent mx-auto mb-4`}
      ></div>
      {message && (
        <p className={`text-slate-600 font-medium ${textSizeClasses[size]}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
