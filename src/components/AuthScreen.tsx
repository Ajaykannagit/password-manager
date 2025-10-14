import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, UserPlus, LogIn, Check, AlertCircle, Info, Users, Trash2, Clock, Sparkles, Zap, Fingerprint } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BiometricManager } from '../utils/crypto';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'userSelect'>('userSelect');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const { login, signup, getAllUsers, deleteUser } = useApp();

  useEffect(() => {
    const users = getAllUsers();
    setExistingUsers(users);
    
    // If no users exist, go directly to signup
    if (users.length === 0) {
      setMode('signup');
    }
    
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setParticlesVisible(true), 500);
    
    // Check biometric availability
    checkBiometricAvailability();
  }, [getAllUsers]);

  const checkBiometricAvailability = async () => {
    try {
      const available = await BiometricManager.isAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  useEffect(() => {
    if (mode === 'signup') {
      setPasswordStrength(calculatePasswordStrength(masterPassword));
    }
  }, [masterPassword, mode]);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    return Math.min(100, score);
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const validatePassword = (password: string): string[] => {
    const issues = [];
    if (password.length < 8) issues.push('At least 8 characters');
    if (!/[a-z]/.test(password)) issues.push('One lowercase letter');
    if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
    if (!/\d/.test(password)) issues.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push('One special character');
    return issues;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Validate password strength
        const issues = validatePassword(masterPassword);
        if (issues.length > 0) {
          setError(`Password must have: ${issues.join(', ')}`);
          setIsLoading(false);
          return;
        }

        if (masterPassword !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (passwordStrength < 60) {
          setError('Please choose a stronger password for better security');
          setIsLoading(false);
          return;
        }

        const success = await signup(masterPassword);
        if (!success) {
          setError('Failed to create account. This master password may already exist.');
        }
      } else if (mode === 'login') {
        const success = await login(masterPassword);
        if (!success) {
          setError('Invalid master password. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!biometricAvailable) {
      setError('Biometric authentication not available on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const userHandle = await BiometricManager.authenticate();
      if (userHandle) {
        // Try to retrieve fallback data
        const fallbackData = await BiometricManager.retrieveFallbackData(userHandle);
        if (fallbackData) {
          // Use fallback data to restore session
          const success = await login(''); // Special case for biometric login
          if (success) {
            return;
          }
        }
        
        setError('Biometric authentication succeeded but no vault data found. Please use master password.');
      } else {
        setError('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setError('Biometric authentication failed. Please use master password.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupBiometric = async () => {
    if (!masterPassword) {
      setError('Please enter your master password first');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // First verify the master password
      const loginSuccess = await login(masterPassword);
      if (!loginSuccess) {
        setError('Invalid master password');
        return;
      }

      // Register biometric authentication
      const userHandle = `user_${Date.now()}`;
      const registered = await BiometricManager.register(userHandle);
      
      if (registered) {
        // Store encrypted vault data for biometric recovery
        await BiometricManager.storeFallbackData(userHandle, 'encrypted_vault_data');
        setShowBiometricSetup(false);
        setError('');
        // Success message could be shown here
      } else {
        setError('Failed to setup biometric authentication');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      setError('Failed to setup biometric authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userHash: string) => {
    if (window.confirm('Are you sure you want to delete this account? All data will be permanently lost.')) {
      deleteUser(userHash);
      const users = getAllUsers();
      setExistingUsers(users);
      
      if (users.length === 0) {
        setMode('signup');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const passwordIssues = mode === 'signup' ? validatePassword(masterPassword) : [];

  if (mode === 'userSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 left-20 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`}></div>
          <div className={`absolute bottom-20 right-20 w-24 h-24 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`} style={{ animationDelay: '2s' }}></div>
          <div className={`absolute top-1/2 left-10 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`} style={{ animationDelay: '4s' }}></div>
        </div>

        <div className={`bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 dark:border-dark-700 transition-all duration-1000 transform glass-morphism ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 mb-4 transition-all duration-700 transform hover-dimensional animate-breathingAura ${
              isVisible ? 'rotate-0 scale-100 animate-energyPulse' : 'rotate-180 scale-0'
            }`}>
              <img 
                src="/i_have_the_password_manager_website_for_that_i_need_the_logo___name_is_kagi_which_mean_key_in_japanese___and_i_don_t_need_the_name_only__need_the__logo-removebg-preview copy.png" 
                alt="Kagi Logo" 
                className="w-28 h-28 object-contain transition-all duration-500 animate-float transform scale-150"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            </div>
            <h1 className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-700 delay-200 text-neon animate-kagiGlow ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              Kagi
            </h1>
            <p className={`text-gray-600 dark:text-gray-300 transition-all duration-700 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              鍵 - Your Digital Key Vault
            </p>
          </div>

          {/* Particle System */}
          <div className="particle-system">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${6 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>

          <div className={`space-y-4 transition-all duration-700 delay-400 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {existingUsers.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 animate-quantumFlicker" />
                    Existing Accounts
                  </h3>
                  <div className="space-y-2">
                    {existingUsers.map((user, index) => (
                      <div 
                        key={user.hash} 
                        className={`flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-500 hover-dimensional card-quantum transform ${
                          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: `${500 + index * 100}ms` }}
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => setMode('login')}>
                          <div className="font-medium text-gray-900 dark:text-white">
                            Account {index + 1}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Hint: {user.hint}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1 animate-pulse" />
                            Last login: {formatDate(user.lastLogin)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.hash)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 hover-quantum micro-bounce"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {biometricAvailable && (
                  <button
                    onClick={handleBiometricAuth}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-500 hover-dimensional btn-holographic transform disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5 animate-pulse" />
                    <span>Use Biometric Authentication</span>
                  </button>
                )}
              </>
            )}

            <div className="space-y-3">
              {existingUsers.length > 0 && (
                <button
                  onClick={() => setMode('login')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 zen-button hover-dimensional transform"
                >
                  <LogIn className="w-5 h-5 animate-float" />
                  <span>Sign In to Existing Account</span>
                </button>
              )}

              <button
                onClick={() => setMode('signup')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 zen-card border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-500 transform"
              >
                <UserPlus className="w-5 h-5 animate-breathe" />
                <span>Create New Account</span>
              </button>
            </div>
          </div>

          <div className={`mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-700 delay-700 holographic-surface ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex items-start space-x-2 stagger-children">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 animate-energyPulse" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 animate-shimmer" />
                  🔒 Multi-User Support
                </p>
                <p>Each master password creates a separate, isolated vault. Your data is encrypted and stored locally.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 left-20 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`}></div>
        <div className={`absolute bottom-20 right-20 w-24 h-24 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-10 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full opacity-20 animate-float ${particlesVisible ? 'animate-particleFloat' : ''}`} style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 cyber-grid opacity-10"></div>
      </div>

      <div className={`bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 dark:border-dark-700 transition-all duration-1000 transform glass-morphism ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      } kagi-container zen-card`}>
        {/* Particle System */}
        <div className="particle-system">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${6 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4 transition-all duration-700 transform hover-dimensional animate-breathingAura ${
            isVisible ? 'rotate-0 scale-100 animate-energyPulse' : 'rotate-180 scale-0'
          }`}>
            <img 
              src="/i_have_the_password_manager_website_for_that_i_need_the_logo___name_is_kagi_which_mean_key_in_japanese___and_i_don_t_need_the_name_only__need_the__logo-removebg-preview copy.png" 
              alt="Kagi Logo" 
              className="w-20 h-20 object-contain transition-all duration-500 animate-float transform scale-125"
              style={{
                filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255,255,255,0.3))',
              }}
            />
          </div>
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-700 delay-200 text-neon ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } animate-kagiGlow`}>
            Kagi
          </h1>
          <p className={`text-gray-600 dark:text-gray-300 transition-all duration-700 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {mode === 'signup' ? '鍵を作成 - Create your secure vault' : 'おかえり - Welcome back to your vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-6 transition-all duration-700 delay-400 stagger-children ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
              Master Password
            </label>
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-300 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 input-holographic hover-glow"
                placeholder={mode === 'signup' ? 'Create a strong master password' : 'Enter your master password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover-quantum micro-rotate"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {mode === 'signup' && masterPassword && (
              <div className="mt-3 space-y-2 animate-elegantFadeIn">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                  <span className={`font-medium transition-colors duration-500 ${
                    passwordStrength < 30 ? 'text-red-600' :
                    passwordStrength < 60 ? 'text-yellow-600' :
                    passwordStrength < 80 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden progress-quantum">
                  <div
                    className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-800 ease-out progress-bar animate-liquidProgress`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>

                {passwordIssues.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2 animate-slideDown holographic-surface">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          Password Requirements:
                        </p>
                        <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                          {passwordIssues.map((issue, index) => (
                            <li key={index} className="flex items-center space-x-1 animate-elegantFadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                              <span className="w-1 h-1 bg-yellow-600 dark:bg-yellow-400 rounded-full animate-pulse"></span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="animate-slideDown">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                Confirm Master Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-300 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 input-holographic hover-glow"
                  placeholder="Confirm your master password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover-quantum micro-rotate"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {confirmPassword && masterPassword !== confirmPassword && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 animate-shake">
                  Passwords do not match
                </p>
              )}
              
              {confirmPassword && masterPassword === confirmPassword && (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm mt-1 animate-bounceIn">
                  <Check className="w-4 h-4 animate-energyPulse" />
                  <span>Passwords match</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm transition-all duration-300 animate-shake holographic-surface">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !masterPassword || (mode === 'signup' && (!confirmPassword || masterPassword !== confirmPassword))}
            className="w-full zen-button py-3 px-4 font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover-dimensional transform"
          >
            {isLoading ? (
              <div className="liquid-loader w-5 h-5"></div>
            ) : (
              <>
                {mode === 'signup' ? <UserPlus className="w-5 h-5 animate-breathe" /> : <LogIn className="w-5 h-5 animate-float" />}
                <span>{mode === 'signup' ? 'Create Vault' : 'Unlock Vault'}</span>
                <Zap className="w-4 h-4 animate-energyPulse" />
              </>
            )}
          </button>
        </form>

        {mode === 'login' && biometricAvailable && !showBiometricSetup && (
          <div className={`mt-4 text-center transition-all duration-700 delay-800 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={() => setShowBiometricSetup(true)}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-all duration-300 hover-quantum micro-glow flex items-center space-x-1 mx-auto zen-button bg-transparent border border-green-300"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Setup Biometric Authentication</span>
            </button>
          </div>
        )}

        {showBiometricSetup && (
          <div className={`mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-all duration-700 delay-900 holographic-surface ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } zen-card`}>
            <div className="flex items-start space-x-2">
              <Fingerprint className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  Setup Biometric Authentication
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mb-3">
                  Use your fingerprint or face to unlock your vault if you forget your master password.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={setupBiometric}
                    disabled={isLoading || !masterPassword}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 zen-button"
                  >
                    Setup Now
                  </button>
                  <button
                    onClick={() => setShowBiometricSetup(false)}
                    className="px-3 py-1 border border-green-300 text-green-700 dark:text-green-300 rounded text-xs hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors zen-card"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`mt-6 text-center transition-all duration-700 delay-600 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <button
            onClick={() => setMode(mode === 'signup' ? 'userSelect' : 'signup')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-all duration-300 hover-quantum micro-glow zen-button bg-transparent border-0"
          >
            {mode === 'signup' ? '← Back to account selection' : 'Create a new account instead'}
          </button>
        </div>

        <div className={`mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-700 delay-700 holographic-surface ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        } zen-card`}>
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 animate-energyPulse" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 animate-shimmer" />
                🔒 AES-256 Encrypted & Secure
              </p>
              <p>NIST-compliant AES-256 encryption with PBKDF2. Each master password creates a separate vault stored locally.</p>
            </div>
          </div>
        </div>

        {mode === 'signup' && (
          <div className={`mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-all duration-700 delay-800 holographic-surface ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } zen-card`}>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 animate-quantumFlicker" />
              <div className="text-xs text-yellow-800 dark:text-yellow-300">
                <p className="font-medium mb-1">⚠️ Important</p>
                <p>Remember your master password! It cannot be recovered if forgotten. Each master password creates a separate account.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}