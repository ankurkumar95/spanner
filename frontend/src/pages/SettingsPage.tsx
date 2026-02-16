import { useState } from 'react';
import { User, Bell, Info, Moon, Sun, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'preferences' | 'about';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const user = useAuthStore((state) => state.user);
  const { sidebarTheme, toggleSidebarTheme } = useThemeStore();

  // Profile form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentNotifications, setAssignmentNotifications] = useState(true);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // TODO: Implement password change API call
    toast.success('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePreferences = () => {
    localStorage.setItem('spanner-items-per-page', itemsPerPage.toString());
    localStorage.setItem('spanner-email-notifications', emailNotifications.toString());
    localStorage.setItem('spanner-push-notifications', pushNotifications.toString());
    localStorage.setItem('spanner-assignment-notifications', assignmentNotifications.toString());

    toast.success('Preferences saved successfully');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile Information</h2>

                    {/* User Info Display */}
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <div className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                          {user?.name || 'Admin User'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                          {user?.email || 'admin@spanner.app'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Roles</label>
                        <div className="flex flex-wrap gap-2">
                          {(user?.roles || ['Admin']).map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                          required
                          minLength={8}
                        />
                        <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
                      </div>

                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Change Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferences</h2>

                    {/* Theme Toggle */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Appearance</label>
                        <button
                          onClick={toggleSidebarTheme}
                          className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {sidebarTheme === 'dark' ? (
                              <Moon className="w-5 h-5 text-slate-700" />
                            ) : (
                              <Sun className="w-5 h-5 text-slate-700" />
                            )}
                            <div className="text-left">
                              <p className="text-sm font-medium text-slate-900">Sidebar Theme</p>
                              <p className="text-xs text-slate-500">
                                Current: {sidebarTheme === 'dark' ? 'Dark' : 'Light'}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-primary-600 font-medium">Toggle</div>
                        </button>
                      </div>

                      {/* Items Per Page */}
                      <div>
                        <label htmlFor="items-per-page" className="block text-sm font-medium text-slate-700 mb-2">
                          Items Per Page
                        </label>
                        <select
                          id="items-per-page"
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                          <p className="text-xs text-slate-500">Receive email updates</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Push Notifications</p>
                          <p className="text-xs text-slate-500">Receive browser notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={pushNotifications}
                          onChange={(e) => setPushNotifications(e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Assignment Notifications</p>
                          <p className="text-xs text-slate-500">Notify when assigned new items</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={assignmentNotifications}
                          onChange={(e) => setAssignmentNotifications(e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <button
                      onClick={handleSavePreferences}
                      className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">About Spanner CRM</h2>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-700">S</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Spanner CRM</h3>
                        <p className="text-sm text-slate-600">Version 1.0.0</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">Build Information</h4>
                        <p className="text-sm text-slate-600">Version: 1.0.0</p>
                        <p className="text-sm text-slate-600">Environment: Production</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Technology Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            React 19
                          </span>
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            TypeScript
                          </span>
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                            Vite
                          </span>
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            TailwindCSS
                          </span>
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                            TanStack Query
                          </span>
                          <span className="inline-flex items-center rounded-md bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">
                            Zustand
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Support</h4>
                        <div className="space-y-2">
                          <a
                            href="mailto:support@spanner.app"
                            className="block text-sm text-primary-600 hover:text-primary-700"
                          >
                            support@spanner.app
                          </a>
                          <a
                            href="/docs"
                            className="block text-sm text-primary-600 hover:text-primary-700"
                          >
                            Documentation
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        © 2024 Spanner CRM. All rights reserved.
                      </p>
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
