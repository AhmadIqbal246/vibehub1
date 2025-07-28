import React from 'react';

const Avatar = ({
  src,
  initials,
  alt = "User Avatar",
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    'xs': 'w-8 h-8 text-xs',
    'sm': 'w-10 h-10 text-sm',
    'md': 'w-12 h-12 text-base',
    'lg': 'w-16 h-16 text-lg',
    'xl': 'w-24 h-24 text-2xl',
  };

  const containerClasses = `
    relative inline-block rounded-full overflow-hidden
    ${sizeClasses[size] || sizeClasses['md']}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="font-semibold text-white">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

export default Avatar; 