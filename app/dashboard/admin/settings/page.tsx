'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Database, Server, Mail, Shield, HardDrive, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface SystemInfo {
  version: string;
  environment: string;
  buildTime: string;
  databaseStatus: 'connected' | 'disconnected' | 'checking';
  featureFlags: {
    aiImages: boolean;
    tts: boolean;
    chatbot: boolean;
  };
  services: {
    database: boolean;
    redis: boolean | null;
    email: boolean | null;
  };
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/admin/system-info');
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: boolean | null }) => {
    if (status === null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          Unknown
        </span>
      );
    }
    return status ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-sm">
        <CheckCircle2 className="w-4 h-4" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-sm">
        <AlertCircle className="w-4 h-4" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('dashboard.admin.settings.title')}</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white rounded-lg"></div>
            <div className="h-32 bg-white rounded-lg"></div>
            <div className="h-32 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.admin.settings.title')}</h1>
          <p className="text-gray-600 mt-2">{t('dashboard.admin.settings.subtitle')}</p>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.admin.settings.systemInfo.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">{t('dashboard.admin.settings.systemInfo.version')}</label>
              <p className="text-gray-900 font-medium">{systemInfo?.version || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('dashboard.admin.settings.systemInfo.environment')}</label>
              <p className="text-gray-900 font-medium capitalize">{systemInfo?.environment || 'production'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('dashboard.admin.settings.systemInfo.buildTime')}</label>
              <p className="text-gray-900 font-medium">
                {systemInfo?.buildTime ? new Date(systemInfo.buildTime).toLocaleString() : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('dashboard.admin.settings.systemInfo.databaseStatus')}</label>
              <div className="mt-1">
                <StatusBadge status={systemInfo?.services.database ?? null} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.admin.settings.featureFlags.title')}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{t('dashboard.admin.settings.featureFlags.aiImages')}</p>
                <p className="text-sm text-gray-600">{t('dashboard.admin.settings.featureFlags.aiImagesDesc')}</p>
              </div>
              <StatusBadge status={systemInfo?.featureFlags.aiImages ?? null} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{t('dashboard.admin.settings.featureFlags.tts')}</p>
                <p className="text-sm text-gray-600">{t('dashboard.admin.settings.featureFlags.ttsDesc')}</p>
              </div>
              <StatusBadge status={systemInfo?.featureFlags.tts ?? null} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{t('dashboard.admin.settings.featureFlags.chatbot')}</p>
                <p className="text-sm text-gray-600">{t('dashboard.admin.settings.featureFlags.chatbotDesc')}</p>
              </div>
              <StatusBadge status={systemInfo?.featureFlags.chatbot ?? null} />
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.admin.settings.services.title')}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('dashboard.admin.settings.services.database')}</p>
                  <p className="text-sm text-gray-600">{t('dashboard.admin.settings.services.databaseDesc')}</p>
                </div>
              </div>
              <StatusBadge status={systemInfo?.services.database ?? null} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('dashboard.admin.settings.services.redis')}</p>
                  <p className="text-sm text-gray-600">{t('dashboard.admin.settings.services.redisDesc')}</p>
                </div>
              </div>
              <StatusBadge status={systemInfo?.services.redis ?? null} />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('dashboard.admin.settings.services.email')}</p>
                  <p className="text-sm text-gray-600">{t('dashboard.admin.settings.services.emailDesc')}</p>
                </div>
              </div>
              <StatusBadge status={systemInfo?.services.email ?? null} />
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold">{t('dashboard.admin.settings.security.title')}</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>{t('dashboard.admin.settings.security.info')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('dashboard.admin.settings.security.sessionTimeout')}</li>
              <li>{t('dashboard.admin.settings.security.passwordPolicy')}</li>
              <li>{t('dashboard.admin.settings.security.apiRateLimit')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
