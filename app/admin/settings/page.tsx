'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Database,
  Mail,
  Shield,
  Globe,
  Bell,
  Save,
  RefreshCw,
  Key,
  Server,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  maxUploadSize: number;
  defaultLanguage: string;
  enableAnalytics: boolean;
  backupFrequency: string;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: '1001 Stories',
    siteDescription: 'Global education platform sharing stories from underserved communities',
    contactEmail: 'admin@1001stories.org',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxUploadSize: 50,
    defaultLanguage: 'en',
    enableAnalytics: true,
    backupFrequency: 'daily'
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would save to the database
      // For now, we'll simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      // This would trigger a manual backup
      console.log('Manual backup triggered');
      alert('Manual backup initiated. Check logs for progress.');
    } catch (error) {
      console.error('Error triggering backup:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      // This would clear application cache
      console.log('Cache cleared');
      alert('Application cache cleared successfully.');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Server },
    { id: 'maintenance', label: 'Maintenance', icon: RefreshCw }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Configure platform settings and preferences</p>
            </div>
            <div className="flex items-center gap-4">
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings saved</span>
                </motion.div>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                        <input
                          type="text"
                          value={settings.siteName}
                          onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                        <textarea
                          value={settings.siteDescription}
                          onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                        <select
                          value={settings.defaultLanguage}
                          onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="ko">Korean</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Send notifications for system events</p>
                        </div>
                        <button
                          onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                          <input
                            type="text"
                            placeholder="smtp.gmail.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                          <input
                            type="number"
                            placeholder="587"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
                        <input
                          type="email"
                          placeholder="noreply@1001stories.org"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h4 className="font-medium text-gray-900">User Registration</h4>
                          <p className="text-sm text-gray-600">Allow new users to register accounts</p>
                        </div>
                        <button
                          onClick={() => setSettings({...settings, registrationEnabled: !settings.registrationEnabled})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            settings.registrationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.registrationEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          placeholder="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password Policy</label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="minLength" className="rounded" />
                            <label htmlFor="minLength" className="text-sm text-gray-700">Minimum 8 characters</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="requireUppercase" className="rounded" />
                            <label htmlFor="requireUppercase" className="text-sm text-gray-700">Require uppercase letter</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="requireNumber" className="rounded" />
                            <label htmlFor="requireNumber" className="text-sm text-gray-700">Require number</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="requireSpecial" className="rounded" />
                            <label htmlFor="requireSpecial" className="text-sm text-gray-700">Require special character</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Settings */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Upload Size (MB)</label>
                        <input
                          type="number"
                          value={settings.maxUploadSize}
                          onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Analytics</h4>
                          <p className="text-sm text-gray-600">Enable usage analytics collection</p>
                        </div>
                        <button
                          onClick={() => setSettings({...settings, enableAnalytics: !settings.enableAnalytics})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            settings.enableAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.enableAnalytics ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="hourly">Every hour</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Settings */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Tools</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 px-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div>
                          <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                          <p className="text-sm text-gray-600">Enable to show maintenance page to users</p>
                        </div>
                        <button
                          onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            settings.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={handleBackupNow}
                          className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-5 h-5 text-blue-600" />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">Create Backup</h4>
                            <p className="text-sm text-gray-600">Generate database backup now</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleClearCache}
                          className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw className="w-5 h-5 text-green-600" />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">Clear Cache</h4>
                            <p className="text-sm text-gray-600">Clear application cache</p>
                          </div>
                        </button>
                      </div>
                      
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-900">Danger Zone</h4>
                            <p className="text-sm text-red-700 mt-1">These actions cannot be undone. Proceed with caution.</p>
                            <div className="mt-3 space-y-2">
                              <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Reset All Settings to Default
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}