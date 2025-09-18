'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';

interface ReadingTimerProps {
  bookId: string;
  onTimeUpdate?: (seconds: number) => void;
}

export function ReadingTimer({ bookId, onTimeUpdate }: ReadingTimerProps) {
  const [isActive, setIsActive] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { sessionData, updateProgress } = useLearningStore();

  useEffect(() => {
    // Initialize timer with existing session time if available
    if (sessionData?.duration) {
      setSeconds(sessionData.duration);
    }
  }, [sessionData]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;
          
          // Update progress every 30 seconds
          if (newSeconds % 30 === 0) {
            updateProgress({ readingTime: newSeconds });
            onTimeUpdate?.(newSeconds);
          }
          
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, updateProgress, onTimeUpdate]);

  // Auto-pause after 2 hours
  useEffect(() => {
    if (seconds >= 7200) {
      setIsActive(false);
    }
  }, [seconds]);

  // Pause when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm">
      <Clock className="w-5 h-5 text-gray-400" />
      <span className="font-mono text-lg font-medium text-gray-700">
        {formatTime(seconds)}
      </span>
      <button
        onClick={toggleTimer}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        title={isActive ? 'Pause timer' : 'Resume timer'}
      >
        {isActive ? (
          <Pause className="w-4 h-4 text-gray-600" />
        ) : (
          <Play className="w-4 h-4 text-gray-600" />
        )}
      </button>
      {!isActive && (
        <span className="text-xs text-orange-600 font-medium">
          PAUSED
        </span>
      )}
    </div>
  );
}