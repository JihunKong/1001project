'use client';

import { Calendar, User, MessageSquare } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface WorkflowEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  createdAt: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
}

interface WorkflowTimelineProps {
  entries: WorkflowEntry[];
  className?: string;
}

export default function WorkflowTimeline({ entries, className = '' }: WorkflowTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-gray-500">No workflow history available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative pl-8 pb-6 last:pb-0">
          {index !== entries.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
          )}

          <div className="absolute left-0 top-1">
            <div className="h-6 w-6 rounded-full bg-white border-2 border-[#5951E7] flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[#5951E7]" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5EA] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={entry.fromStatus} size="sm" />
                <span className="text-gray-400">→</span>
                <StatusBadge status={entry.toStatus} size="sm" />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                <Calendar className="h-3 w-3" />
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{entry.performedBy.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{entry.performedBy.email}</span>
            </div>

            {entry.comment && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{entry.comment}</p>
                </div>
              </div>
            )}

            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {entry.metadata.priority && (
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className={`ml-2 font-medium ${
                        entry.metadata.priority === 'URGENT' ? 'text-red-600' :
                        entry.metadata.priority === 'HIGH' ? 'text-orange-600' :
                        entry.metadata.priority === 'MEDIUM' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {entry.metadata.priority}
                      </span>
                    </div>
                  )}
                  {entry.metadata.dueDate && (
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="ml-2 font-medium text-gray-700">
                        {new Date(entry.metadata.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {entry.metadata.revisionTypes && entry.metadata.revisionTypes.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Revision Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.metadata.revisionTypes.map((type: string) => (
                          <span
                            key={type}
                            className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
