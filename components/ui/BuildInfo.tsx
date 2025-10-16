'use client';

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface BuildInfoData {
  version: string;
  buildTime: string;
  buildTimestamp: number;
  gitCommit: string;
  environment: string;
}

interface BuildInfoProps {
  className?: string;
  showOnHover?: boolean;
}

export default function BuildInfo({ className = '', showOnHover = true }: BuildInfoProps) {
  const [buildInfo, setBuildInfo] = useState<BuildInfoData | null>(null);
  const [showInfo, setShowInfo] = useState(!showOnHover);

  useEffect(() => {
    fetch('/build-info.json')
      .then(res => res.json())
      .then(data => setBuildInfo(data))
      .catch(err => console.warn('Could not load build info:', err));
  }, []);

  if (!buildInfo) {
    return null;
  }

  const buildDate = new Date(buildInfo.buildTime);
  const timeAgo = Math.floor((Date.now() - buildInfo.buildTimestamp) / (1000 * 60));

  return (
    <div className={`relative ${className}`}>
      <button
        onMouseEnter={() => showOnHover && setShowInfo(true)}
        onMouseLeave={() => showOnHover && setShowInfo(false)}
        onClick={() => !showOnHover && setShowInfo(!showInfo)}
        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        title="Build information"
      >
        <Info className="h-3 w-3" />
        <span>v{buildInfo.version}</span>
      </button>

      {showInfo && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600 z-50 whitespace-nowrap">
          <div className="space-y-1">
            <div><strong>Version:</strong> {buildInfo.version}</div>
            <div><strong>Built:</strong> {buildDate.toLocaleString()}</div>
            <div><strong>Age:</strong> {timeAgo}m ago</div>
            <div><strong>Environment:</strong> {buildInfo.environment}</div>
            {buildInfo.gitCommit !== 'unknown' && (
              <div><strong>Commit:</strong> {buildInfo.gitCommit.substring(0, 8)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}