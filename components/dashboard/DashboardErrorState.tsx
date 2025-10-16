'use client';

interface DashboardErrorStateProps {
  error: string;
  onRetry?: () => void;
  role?: string;
  className?: string;
}

export default function DashboardErrorState({
  error,
  onRetry,
  role,
  className = ''
}: DashboardErrorStateProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      data-role={role}
      className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}