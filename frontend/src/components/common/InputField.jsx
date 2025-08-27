import React, { useState } from 'react';

const InputField = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  required,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className={`w-full group ${className}`}>
      {label && (
        <label 
          htmlFor={id || name} 
          className={`
            block text-xs font-semibold mb-2 transition-all duration-300
            ${isFocused || value ? 'text-indigo-300' : 'text-white/90'}
            ${error ? 'text-red-400' : ''}
          `}
        >
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div 
        className={`
          relative transform transition-all duration-300 ease-in-out
          ${isFocused ? 'scale-[1.02]' : ''}
          ${isHovered && !isFocused ? 'scale-[1.01]' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient border effect */}
        <div className={`
          absolute inset-0 rounded-2xl transition-all duration-300
          ${isFocused 
            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px]' 
            : error 
              ? 'bg-gradient-to-r from-red-400 to-red-600 p-[1px]'
              : 'bg-gray-200 p-[1px] group-hover:bg-gradient-to-r group-hover:from-indigo-200 group-hover:to-purple-200'
          }
        `}>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl h-full w-full"></div>
        </div>
        
        {/* Icon */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Icon 
              className={`
                h-5 w-5 transition-all duration-300
                ${isFocused 
                  ? 'text-indigo-600 transform scale-110' 
                  : error 
                    ? 'text-red-500'
                    : 'text-gray-400 group-hover:text-indigo-400'
                }
              `} 
              aria-hidden="true" 
            />
          </div>
        )}
        
        {/* Input */}
        <input
          type={type}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            relative z-10 w-full py-3 px-4 text-gray-900 placeholder-gray-400
            ${Icon ? 'pl-12 sm:pl-12' : 'pl-4'}
            bg-transparent border-none rounded-2xl
            focus:outline-none transition-all duration-300
            text-base sm:text-base font-medium
            ${error ? 'text-red-900 placeholder-red-400' : ''}
            ${isFocused ? 'placeholder-transparent' : ''}
            touch-manipulation
          `}
          {...props}
        />
        
        
        {/* Focus glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none
          ${isFocused 
            ? 'shadow-2xl shadow-indigo-500/25 bg-gradient-to-r from-indigo-50/50 to-purple-50/50' 
            : ''
          }
        `} />
      </div>
      
      {/* Error message with animation */}
      {error && (
        <div className="overflow-hidden">
          <p 
            className="mt-3 text-sm text-red-400 font-medium animate-pulse flex items-center gap-2"
            id={`${id || name}-error`}
          >
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default InputField; 