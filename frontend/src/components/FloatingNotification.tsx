import { useEffect, useState } from 'react';

interface FloatingNotificationProps {
  error?: string;
  success?: string;
  onClear?: () => void;
  duration?: number;
}

export default function FloatingNotification({ 
  error, 
  success,
  onClear,
  duration = 3000 
}: FloatingNotificationProps) {
  const [internalSuccess, setInternalSuccess] = useState(success || "");
  const [internalError, setInternalError] = useState(error || "");

  // Sync internal states with props
  useEffect(() => {
    setInternalError(error || "");
  }, [error]);

  useEffect(() => {
    setInternalSuccess(success || "");
  }, [success]);

  // Auto-clear messages with fade animations
  useEffect(() => {
    if (internalSuccess || internalError) {
      const timer = setTimeout(() => {
        if (onClear) {
          onClear();
        }
        setInternalSuccess("");
        setInternalError("");
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [internalSuccess, internalError, onClear, duration]);

  if (!internalError && !internalSuccess) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 pointer-events-none">
      {internalError && (
        <div className="text-red-400 bg-red-900/90 p-4 rounded-lg border border-red-800 shadow-xl animate-fade-in-out">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {internalError}
          </div>
        </div>
      )}
      
      {internalSuccess && (
        <div className="text-green-400 bg-green-900/90 p-4 rounded-lg border border-green-800 shadow-xl animate-fade-in-out">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {internalSuccess}
          </div>
        </div>
      )}
    </div>
  );
}