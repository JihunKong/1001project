'use client';

import { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

interface DashboardTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  className?: string;
  loading?: boolean;
  stickyHeader?: boolean;
}

export default function DashboardTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  className = '',
  loading = false,
  stickyHeader = false
}: DashboardTableProps<T>) {
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(3)].map((_, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.className || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                {emptyState ? (
                  <div className="flex flex-col items-center">
                    {emptyState.icon || (
                      <CheckCircle className="h-12 w-12 text-green-300 mb-4" />
                    )}
                    <p className="font-medium text-gray-900 mb-1">{emptyState.title}</p>
                    {emptyState.description && (
                      <p className="text-sm text-gray-500 mb-4">{emptyState.description}</p>
                    )}
                    {emptyState.action}
                  </div>
                ) : (
                  <p>No data available</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                  >
                    {column.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}