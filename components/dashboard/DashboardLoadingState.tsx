'use client';

interface DashboardLoadingStateProps {
  message?: string;
  role?: string;
  className?: string;
}

export default function DashboardLoadingState({
  message = 'Loading dashboard...',
  role,
  className = ''
}: DashboardLoadingStateProps) {
  return (
    <div
      data-role={role}
      className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}