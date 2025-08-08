import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Headphones } from 'lucide-react';

const AudioMessage = ({ audioData, isCurrentUser, messageId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoverPosition, setHoverPosition] = useState(-1);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  // Format time properly - seconds first, then minutes if long
  const formatTime = (timeInSeconds) => {
    if (!isFinite(timeInSeconds) || isNaN(timeInSeconds)) return "0:00";
    
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate number of waveform lines based on duration
  const getWaveformLines = (duration) => {
    if (!duration || duration <= 0) return 8;  // minimum lines
    
    if (duration <= 10) return 8;       // 10s or less - 8 lines
    if (duration <= 30) return 12;      // 30s or less - 12 lines
    if (duration <= 60) return 16;      // 1 minute or less - 16 lines
    if (duration <= 120) return 20;     // 2 minutes or less - 20 lines
    if (duration <= 300) return 24;     // 5 minutes or less - 24 lines
    return 28;                          // longer than 5 minutes - 28 lines
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    // Backup time update handler for browsers that may not support requestAnimationFrame properly
    if (audioRef.current && !isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !duration) return;
    
    const waveform = e.currentTarget;
    const rect = waveform.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleWaveformHover = (e) => {
    const waveform = e.currentTarget;
    const rect = waveform.getBoundingClientRect();
    const hoverPos = ((e.clientX - rect.left) / rect.width) * 100;
    setHoverPosition(Math.max(0, Math.min(100, hoverPos)));
  };

  // Use useEffect to continuously update progress when playing
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const waveformLines = getWaveformLines(duration);

  return (
    <div 
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-lg w-72 sm:w-80 ${
        isCurrentUser 
          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-200/30' 
          : 'bg-gradient-to-r from-white to-gray-50 text-gray-700 shadow-gray-200/50 border border-gray-100'
      }`}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-2xl z-10">
          <div className={`animate-spin rounded-full h-5 w-5 border-2 border-t-transparent ${
            isCurrentUser ? 'border-white/30' : 'border-blue-500/30'
          }`}></div>
        </div>
      )}

      {/* Audio Icon */}
      <div className={`p-1.5 sm:p-2 rounded-xl ${
        isCurrentUser 
          ? 'bg-white/10 text-white/80' 
          : 'bg-blue-50 text-blue-500'
      }`}>
        <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 flex-shrink-0 ${
          isCurrentUser
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
        )}
      </button>

      {/* Progress Section */}
      <div className="flex-1 space-y-2">
        {/* Waveform Visual Effect with Interactive Tracker */}
        <div 
          className="flex items-center justify-between gap-1 h-5 sm:h-6 flex-1 cursor-pointer relative"
          onClick={handleWaveformClick}
          onMouseMove={handleWaveformHover}
          onMouseLeave={() => setHoverPosition(-1)}
        >
          {[...Array(waveformLines)].map((_, i) => {
            const isActive = i < (progressPercentage / 100) * waveformLines;
            const isHovered = hoverPosition >= 0 && i <= (hoverPosition / 100) * waveformLines;
            
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? isCurrentUser 
                      ? 'bg-white' 
                      : 'bg-blue-500'
                    : isHovered
                      ? isCurrentUser
                        ? 'bg-white/60'
                        : 'bg-blue-400'
                      : isCurrentUser 
                        ? 'bg-white/20' 
                        : 'bg-gray-300'
                }`}
                style={{
                  width: '2px',
                  height: `${8 + (i % 3) * 4 + Math.sin(i * 0.5) * 6}px`,
                }}
              />
            );
          })}
          
          {/* Playback Position Indicator */}
          <div 
            className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-200 ${
              isCurrentUser ? 'bg-white shadow-lg' : 'bg-blue-600 shadow-lg'
            } ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center">
          <span className={`text-sm font-medium tabular-nums ${
            isCurrentUser ? 'text-white/90' : 'text-gray-600'
          }`}>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`data:audio/webm;base64,${audioData}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
};

export default AudioMessage;
