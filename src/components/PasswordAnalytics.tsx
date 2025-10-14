import React, { useState, useEffect } from 'react';
import { X, BarChart3, PieChart, TrendingUp, Clock, Shield, Users, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SecurityAnalyzer } from '../utils/security';

interface PasswordAnalyticsProps {
  onClose: () => void;
}

export function PasswordAnalytics({ onClose }: PasswordAnalyticsProps) {
  const { passwords, categories } = useApp();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const data = SecurityAnalyzer.getPasswordAnalytics(passwords);
    setAnalytics(data);
  }, [passwords]);

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Analyzing password data...</p>
        </div>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#6B7280';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Overview Stats */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {analytics.totalPasswords}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Passwords</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {analytics.recentlyUsed}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Used (30 days)</div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {analytics.averagePasswordAge}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Avg Age (days)</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {analytics.neverUsed}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Never Used</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Password Strength Distribution */}
            <div className="bg-white dark:bg-dark-700 rounded-xl p-6 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Password Strength Distribution
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.strengthDistribution).map(([strength, count]) => {
                  const percentage = analytics.totalPasswords > 0 ? (count as number / analytics.totalPasswords) * 100 : 0;
                  const colors = {
                    weak: 'bg-red-500',
                    fair: 'bg-yellow-500',
                    good: 'bg-blue-500',
                    strong: 'bg-green-500'
                  };
                  
                  return (
                    <div key={strength} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${colors[strength as keyof typeof colors]}`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {strength}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[strength as keyof typeof colors]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white dark:bg-dark-700 rounded-xl p-6 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Category Distribution
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.categoryStats)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([categoryId, count]) => {
                    const percentage = analytics.totalPasswords > 0 ? (count as number / analytics.totalPasswords) * 100 : 0;
                    const categoryName = getCategoryName(categoryId);
                    const categoryColor = getCategoryColor(categoryId);
                    
                    return (
                      <div key={categoryId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: categoryColor }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {categoryName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ 
                                backgroundColor: categoryColor,
                                width: `${percentage}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Insights & Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Usage Patterns</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Most used category: {analytics.mostUsedCategory}</li>
                  <li>• {analytics.neverUsed} passwords never used</li>
                  <li>• {analytics.recentlyUsed} passwords used recently</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Security Health</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {analytics.strengthDistribution.strong} strong passwords</li>
                  <li>• {analytics.strengthDistribution.weak} weak passwords need updating</li>
                  <li>• Average password age: {analytics.averagePasswordAge} days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}