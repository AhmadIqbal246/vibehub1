import React from 'react';
import ReactDOM from 'react-dom';

const Popup = ({ open, onClose, title, description, children, className = '', showClose = true }) => {
  if (!open) return null;
  const popupContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Animated background particles (blue/gray) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-20 animate-float-particles" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <radialGradient id="g1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" /> {/* Blue-400 */}
              <stop offset="100%" stopColor="#e0e7ef" stopOpacity="0" /> {/* Gray-100 */}
            </radialGradient>
            <radialGradient id="g2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" /> {/* Blue-500 */}
              <stop offset="100%" stopColor="#e0e7ef" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="20%" cy="30%" r="80" fill="url(#g1)" />
          <circle cx="80%" cy="70%" r="60" fill="url(#g2)" />
          <circle cx="60%" cy="20%" r="40" fill="url(#g1)" />
        </svg>
      </div>
      {/* Blurred, blue gradient background */}
      <div className="absolute inset-0 backdrop-blur-[10px] bg-gradient-to-br from-blue-100/80 via-blue-200/60 to-gray-100/60 transition-all" aria-hidden="true"></div>
      {/* Popup content with glassmorphism and 3D tilt (no border) */}
      <div
        className={`relative w-full max-w-md mx-4 sm:mx-0 bg-white/80 rounded-3xl shadow-2xl p-8 animate-fade-in-up group ${className}`}
        style={{
          minWidth: '0',
          boxShadow: '0 16px 64px 0 rgba(59, 130, 246, 0.12), 0 2px 12px 0 rgba(30, 64, 175, 0.10)',
          // No border or borderImage
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          background: 'rgba(255,255,255,0.82)',
          overflow: 'hidden',
          transition: 'transform 0.25s cubic-bezier(.23,1.02,.32,1), box-shadow 0.25s',
        }}
        tabIndex={-1}
        onMouseMove={e => {
          // 3D tilt effect
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const dx = x - rect.width / 2;
          const dy = y - rect.height / 2;
          el.style.transform = `rotateY(${dx/30}deg) rotateX(${-dy/30}deg) scale(1.01)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
        }}
      >
        {/* Soft inner glow */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none z-0" style={{boxShadow: 'inset 0 0 48px 8px #60a5fa22'}}></div>
        {showClose && onClose && (
          <button
            className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 text-2xl font-bold focus:outline-none bg-blue-100 hover:bg-blue-200 rounded-full w-10 h-10 flex items-center justify-center shadow transition-all ripple"
            onClick={e => {
              // Ripple effect
              const btn = e.currentTarget;
              const circle = document.createElement('span');
              circle.className = 'ripple-effect';
              btn.appendChild(circle);
              setTimeout(() => circle.remove(), 500);
              if (onClose) onClose();
            }}
            aria-label="Close popup"
            style={{boxShadow: '0 2px 12px 0 #60a5fa88'}}>
            <span className="sr-only">Close</span>
            &times;
          </button>
        )}
        {title && <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700 drop-shadow-lg tracking-tight font-[Poppins,Inter,sans-serif]" style={{letterSpacing: '-0.02em', fontFamily: 'Poppins, Inter, sans-serif'}}>{title}</h2>}
        {description && <p className="mb-6 text-center text-blue-600 text-lg font-medium font-[Inter,sans-serif]" style={{textShadow: '0 1px 12px #60a5fa22', fontFamily: 'Inter, sans-serif'}}>{description}</p>}
        <div className="relative z-20">{children}</div>
      </div>
      {/* Animation keyframes and ripple effect */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.45s cubic-bezier(.23,1.02,.32,1) both;
        }
        @keyframes border-glow {
          0% { box-shadow: 0 0 48px 12px #60a5fa44, 0 0 0 3px #3b82f6; }
          50% { box-shadow: 0 0 64px 24px #3b82f688, 0 0 0 3px #60a5fa88; }
          100% { box-shadow: 0 0 48px 12px #60a5fa44, 0 0 0 3px #3b82f6; }
        }
        .animate-border-glow {
          animation: border-glow 2.5s ease-in-out infinite;
        }
        @keyframes float-particles {
          0% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
          100% { transform: translateY(0); }
        }
        .animate-float-particles {
          animation: float-particles 8s ease-in-out infinite;
        }
        .ripple-effect {
          position: absolute;
          width: 120%;
          height: 120%;
          left: -10%;
          top: -10%;
          background: radial-gradient(circle, #60a5fa 0%, #3b82f6 60%, transparent 100%);
          opacity: 0.3;
          border-radius: 50%;
          pointer-events: none;
          animation: ripple-pop 0.5s linear;
          z-index: 30;
        }
        @keyframes ripple-pop {
          0% { transform: scale(0.2); opacity: 0.7; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
  return ReactDOM.createPortal(popupContent, document.body);
};

export default Popup;