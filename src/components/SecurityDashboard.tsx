import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SecurityAnalyzer } from '../utils/security';
import { SecurityReport } from '../types';

interface SecurityDashboardProps {
  onClose: () => void;
}

export function SecurityDashboard({ onClose }: SecurityDashboardProps) {
  const { passwords, settings } = useApp();
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'weak' | 'reused' | 'expired' | 'compromised'>('overview');

  useEffect(() => {
    analyzePasswords();
  }, [passwords]);

  const analyzePasswords = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = SecurityAnalyzer.analyzePasswordSecurity(passwords);
      setSecurityReport(analysis);
    } catch (error) {
      console.error('Security analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!securityReport) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Analyzing password security...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Security Score Overview */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Overall Security Score</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Based on password strength, reuse, and age</p>
              </div>
              <button
                onClick={analyzePasswords}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 text-center">
                <div className={`text-3xl font-bold ${getScoreColor(securityReport.securityScore)}`}>
                  {Math.round(securityReport.securityScore)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Security Score</div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBackground(securityReport.securityScore)} transition-all duration-500`}
                    style={{ width: `${securityReport.securityScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {securityReport.weakPasswords}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Weak Passwords</div>
                {securityReport.weakPasswords > 0 && (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 mx-auto mt-1" />
                )}
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {securityReport.reusedPasswords}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Reused Passwords</div>
                {securityReport.reusedPasswords > 0 && (
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mx-auto mt-1" />
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {securityReport.expiredPasswords}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Expired Passwords</div>
                {securityReport.expiredPasswords > 0 && (
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mx-auto mt-1" />
                )}
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {securityReport.compromisedPasswords}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Compromised</div>
                {securityReport.compromisedPasswords > 0 && (
                  <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mt-1" />
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Recommendations</h3>
            <div className="space-y-3">
              {securityReport.weakPasswords > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">
                      Update {securityReport.weakPasswords} weak password{securityReport.weakPasswords > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols.
                    </p>
                  </div>
                </div>
              )}

              {securityReport.reusedPasswords > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-300">
                      Replace {securityReport.reusedPasswords} reused password{securityReport.reusedPasswords > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Each account should have a unique password to prevent credential stuffing attacks.
                    </p>
                  </div>
                </div>
              )}

              {securityReport.expiredPasswords > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">
                      Update {securityReport.expiredPasswords} expired password{securityReport.expiredPasswords > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Passwords older than {settings.passwordExpiryDays} days should be updated regularly.
                    </p>
                  </div>
                </div>
              )}

              {securityReport.securityScore >= 80 && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Excellent password security!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your passwords are strong and well-managed. Keep up the good work!
                    </p>
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