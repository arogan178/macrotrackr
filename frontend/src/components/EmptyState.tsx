import { memo } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {icon ? (
        <div className="mb-4 text-gray-400">{icon}</div>
      ) : (
        <div className="mb-4 rounded-full bg-gray-800 p-4 inline-block">
          <svg 
            className="h-8 w-8 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M20 12H4M12 4v16"
            />
          </svg>
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{message}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default memo(EmptyState);
