import React, { useState, useEffect } from 'react';
import { Search, Plus, Settings, LogOut, Folder, Star, Key, Download, Upload, Trash2, Shield, Users, Briefcase, CreditCard, ShoppingBag, BarChart3, Activity, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { ImportExportModal } from './ImportExportModal';
import { SecurityDashboard } from './SecurityDashboard';
import { ActivityLogs } from './ActivityLogs';
import { PasswordAnalytics } from './PasswordAnalytics';

export function Sidebar() {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    setShowPasswordGenerator,
    setEditingPassword,
    logout,
    passwords,
    exportData,
    clearAllData
  } = useApp();

  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const favoriteCount = passwords.filter(p => p.isFavorite).length;

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleAddPassword = () => {
    setEditingPassword(null);
    setShowPasswordGenerator(false);
    setTimeout(() => {
      setEditingPassword({} as any);
    }, 0);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL passwords? This action cannot be undone.')) {
      clearAllData();
      setShowClearConfirm(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons = {
      User: Users,
      Briefcase: Briefcase,
      Users: Users,
      CreditCard: CreditCard,
      ShoppingBag: ShoppingBag,
    };
    return icons[iconName as keyof typeof icons] || Folder;
  };

  const getPasswordStats = () => {
    const total = passwords.length;
    const weak = passwords.filter(p => {
      const strength = calculatePasswordStrength(p.password);
      return strength < 30;
    }).length;
    const strong = passwords.filter(p => {
      const strength = calculatePasswordStrength(p.password);
      return strength >= 80;
    }).length;
    
    return { total, weak, strong };
  };

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    return Math.min(100, score);
  };

  const stats = getPasswordStats();

  return (
    <>
      <div className={`w-72 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col h-full transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
      }`}>
        <div className={`p-6 border-b border-gray-200 dark:border-dark-700 transition-all duration-500 delay-200 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-16 h-16 flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-110 hover:rotate-3 animate-breathingAura ${
              isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              <img 
                src="/i_have_the_password_manager_website_for_that_i_need_the_logo___name_is_kagi_which_mean_key_in_japanese___and_i_don_t_need_the_name_only__need_the__logo-removebg-preview copy.png" 
                alt="Kagi Logo" 
                className="w-14 h-14 object-contain drop-shadow-md hover:drop-shadow-lg transition-all duration-300 animate-subtleFloat transform scale-125"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200 animate-kagiGlow">Kagi</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">鍵 - Digital Key Vault</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 transition-all duration-500 hover:scale-105 card-hover ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '300ms' }}>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 animate-fadeIn">{stats.total}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Total</div>
            </div>
            <div className={`bg-green-50 dark:bg-green-900/20 rounded-lg p-2 transition-all duration-500 hover:scale-105 card-hover ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className="text-lg font-bold text-green-600 dark:text-green-400 animate-fadeIn">{stats.strong}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Strong</div>
            </div>
            <div className={`bg-red-50 dark:bg-red-900/20 rounded-lg p-2 transition-all duration-500 hover:scale-105 card-hover ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '500ms' }}>
              <div className="text-lg font-bold text-red-600 dark:text-red-400 animate-fadeIn">{stats.weak}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Weak</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-auto">
          <div className={`space-y-2 transition-all duration-500 delay-600 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={handleAddPassword}
              className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform micro-bounce"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Password</span>
            </button>

            <button
              onClick={() => setShowPasswordGenerator(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
            >
              <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Password Generator</span>
            </button>

            <button
              onClick={() => setShowSecurity(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Security Report</span>
            </button>

            <button
              onClick={() => setShowAnalytics(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Analytics</span>
            </button>

            <button
              onClick={() => setShowActivityLogs(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
            >
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Activity Logs</span>
            </button>
          </div>

          <div className={`transition-all duration-500 delay-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 transition-colors duration-200">
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] transform ${
                  selectedCategory === null
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:shadow-md'
                }`}
              >
                <Folder className="w-5 h-5" />
                <span className="flex-1 text-left">All Items</span>
                <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full transition-all duration-200 hover:scale-110">
                  {passwords.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('favorites')}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] transform ${
                  selectedCategory === 'favorites'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:shadow-md'
                }`}
              >
                <Star className={`w-5 h-5 ${selectedCategory === 'favorites' ? 'fill-current animate-pulse' : ''}`} />
                <span className="flex-1 text-left">Favorites</span>
                <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full transition-all duration-200 hover:scale-110">
                  {favoriteCount}
                </span>
              </button>

              {categories.map((category, index) => {
                const count = passwords.filter(p => p.category === category.id).length;
                const IconComponent = getCategoryIcon(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] transform animate-slideInLeft ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${800 + index * 100}ms` }}
                  >
                    <IconComponent className="w-5 h-5 transition-all duration-200 hover:scale-110" style={{ color: category.color }} />
                    <span className="flex-1 text-left">{category.name}</span>
                    <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full transition-all duration-200 hover:scale-110">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t border-gray-200 dark:border-dark-700 space-y-2 transition-all duration-500 delay-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <button 
            onClick={() => setShowImportExport(true)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
          >
            <Download className="w-5 h-5" />
            <span>Import/Export</span>
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
          >
            <Settings className="w-5 h-5 transition-all duration-200 hover:rotate-90" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear All Data</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-md transform card-hover"
          >
            <LogOut className="w-5 h-5" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showImportExport && <ImportExportModal onClose={() => setShowImportExport(false)} />}
      {showSecurity && <SecurityDashboard onClose={() => setShowSecurity(false)} />}
      {showActivityLogs && <ActivityLogs onClose={() => setShowActivityLogs(false)} />}
      {showAnalytics && <PasswordAnalytics onClose={() => setShowAnalytics(false)} />}
      
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl p-6 w-full max-w-md transition-all duration-300 animate-scaleIn">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Clear All Data</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-200">
              This will permanently delete all your passwords and cannot be undone. Are you sure?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 hover:scale-[1.02] transform"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 hover:scale-[1.02] transform micro-bounce"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}