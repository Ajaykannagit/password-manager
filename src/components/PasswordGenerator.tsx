import React, { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Check, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PasswordGenerator() {
  const { setShowPasswordGenerator } = useApp();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const generatePassword = () => {
    let charset = '';
    let similar = 'il1Lo0O';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    if (!charset) {
      setPassword('');
      return;
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(result);
    setGenerationHistory(prev => [result, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = async (text: string = password) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const getPasswordStrength = (pwd: string = password) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
    if (/\d/.test(pwd)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 15;
    return Math.min(100, score);
  };

  const strength = getPasswordStrength();

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

  const getStrengthIcon = (strength: number) => {
    if (strength < 30) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (strength < 60) return <Zap className="w-4 h-4 text-yellow-600" />;
    return <Shield className="w-4 h-4 text-green-600" />;
  };

  const presets = [
    { name: 'High Security', length: 20, upper: true, lower: true, numbers: true, symbols: true, similar: true },
    { name: 'Balanced', length: 16, upper: true, lower: true, numbers: true, symbols: true, similar: false },
    { name: 'Simple', length: 12, upper: true, lower: true, numbers: true, symbols: false, similar: true },
    { name: 'PIN Code', length: 6, upper: false, lower: false, numbers: true, symbols: false, similar: true },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setLength(preset.length);
    setIncludeUppercase(preset.upper);
    setIncludeLowercase(preset.lower);
    setIncludeNumbers(preset.numbers);
    setIncludeSymbols(preset.symbols);
    setExcludeSimilar(preset.similar);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto transition-all duration-700 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div className={`flex items-center space-x-3 transition-all duration-500 delay-200 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          }`}>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center animate-breathe">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Generator</h2>
          </div>
          <button
            onClick={() => setShowPasswordGenerator(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Generated Password */}
          <div className={`transition-all duration-500 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 font-mono text-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-700 dark:to-dark-600 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-600 break-all min-h-[60px] flex items-center transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md">
                <span className={password ? 'animate-elegantFadeIn' : ''}>
                  {password || 'Configure options to generate password'}
                </span>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => copyToClipboard()}
                  disabled={!password}
                  className="p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:shadow-lg btn-premium"
                  title="Copy password"
                >
                  {copied ? <Check className="w-5 h-5 animate-bounceIn" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={generatePassword}
                  disabled={!password}
                  className="p-3 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:shadow-lg btn-premium"
                  title="Generate new password"
                >
                  <RefreshCw className="w-5 h-5 hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {password && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-700 dark:to-dark-600 rounded-xl p-4 animate-slideDown">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Strength</span>
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">
                      {getStrengthIcon(strength)}
                    </div>
                    <span className={`font-medium text-sm transition-colors duration-300 ${
                      strength < 30 ? 'text-red-600' :
                      strength < 60 ? 'text-yellow-600' :
                      strength < 80 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getStrengthText(strength)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden progress-premium">
                  <div
                    className={`h-full ${getStrengthColor(strength)} transition-all duration-800 ease-out progress-bar`}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className={`transition-all duration-500 delay-400 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 text-left border border-gray-200 dark:border-dark-600 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 hover:scale-105 hover:shadow-md card-hover animate-slideInLeft`}
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{preset.length} chars</div>
                </button>
              ))}
            </div>
          </div>

          {/* Length Slider */}
          <div className={`transition-all duration-500 delay-600 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Length: <span className="font-bold text-blue-600 dark:text-blue-400 animate-pulse">{length}</span> characters
            </label>
            <div className="relative">
              <input
                type="range"
                min="4"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer slider-premium"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((length - 4) / 60) * 100}%, #E5E7EB ${((length - 4) / 60) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>4</span>
                <span>64</span>
              </div>
            </div>
          </div>

          {/* Character Options */}
          <div className={`space-y-4 transition-all duration-500 delay-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Character Types</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { state: includeUppercase, setState: setIncludeUppercase, label: 'Uppercase Letters', example: 'A-Z' },
                { state: includeLowercase, setState: setIncludeLowercase, label: 'Lowercase Letters', example: 'a-z' },
                { state: includeNumbers, setState: setIncludeNumbers, label: 'Numbers', example: '0-9' },
                { state: includeSymbols, setState: setIncludeSymbols, label: 'Symbols', example: '!@#$%^&*' },
                { state: excludeSimilar, setState: setExcludeSimilar, label: 'Exclude Similar Characters', example: 'il1Lo0O' }
              ].map((option, index) => (
                <label 
                  key={option.label}
                  className={`flex items-center justify-between p-3 border border-gray-200 dark:border-dark-600 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-md card-hover animate-slideInRight`}
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={option.state}
                      onChange={(e) => option.setState(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{option.label}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-dark-600 px-2 py-1 rounded">{option.example}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <div className={`transition-all duration-500 delay-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Passwords</h3>
              <div className="space-y-2">
                {generationHistory.slice(1).map((pwd, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-2 p-2 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-300 hover:scale-[1.02] card-hover animate-slideInLeft`}
                    style={{ animationDelay: `${1100 + index * 100}ms` }}
                  >
                    <code className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-300 truncate">{pwd}</code>
                    <button
                      onClick={() => copyToClipboard(pwd)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110"
                      title="Copy this password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {copied && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm flex items-center space-x-2 animate-bounceIn">
              <Check className="w-4 h-4" />
              <span>Password copied to clipboard!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Key({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}