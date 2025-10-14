import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Shuffle, Check, Plus, Trash2, Calendar, Shield, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PasswordEntry } from '../types';
import { SecurityAnalyzer, TwoFactorAuth } from '../utils/security';

export function AdvancedPasswordForm() {
  const { editingPassword, setEditingPassword, addPassword, updatePassword, categories } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: categories[0]?.id || '',
    isFavorite: false,
    tags: [] as string[],
    expiryDate: '',
    twoFactorSecret: '',
    customFields: [] as { label: string; value: string; type: 'text' | 'password' | 'email' | 'url' }[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isCompromised, setIsCompromised] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isAddMode = editingPassword && !editingPassword.id;
  const isEditMode = editingPassword && editingPassword.id;

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: editingPassword.title,
        username: editingPassword.username,
        password: editingPassword.password,
        url: editingPassword.url || '',
        notes: editingPassword.notes || '',
        category: editingPassword.category,
        isFavorite: editingPassword.isFavorite || false,
        tags: editingPassword.tags || [],
        expiryDate: editingPassword.expiryDate ? new Date(editingPassword.expiryDate).toISOString().split('T')[0] : '',
        twoFactorSecret: editingPassword.twoFactorSecret || '',
        customFields: editingPassword.customFields || [],
      });
      setIsCompromised(editingPassword.isCompromised || false);
    } else if (isAddMode) {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: categories[0]?.id || '',
        isFavorite: false,
        tags: [],
        expiryDate: '',
        twoFactorSecret: '',
        customFields: [],
      });
      setIsCompromised(false);
    }
  }, [editingPassword, categories, isAddMode, isEditMode]);

  useEffect(() => {
    setPasswordStrength(SecurityAnalyzer.calculatePasswordStrength(formData.password));
    checkPasswordBreach();
  }, [formData.password]);

  const checkPasswordBreach = async () => {
    if (formData.password.length > 0) {
      try {
        const compromised = await SecurityAnalyzer.checkPasswordBreach(formData.password);
        setIsCompromised(compromised);
      } catch (error) {
        console.error('Breach check failed:', error);
      }
    }
  };

  const generatePassword = () => {
    const password = SecurityAnalyzer.generateSecurePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      excludeAmbiguous: false,
    });
    setFormData({ ...formData, password });
  };

  const generateTwoFactorSecret = () => {
    const secret = TwoFactorAuth.generateSecret();
    setFormData({ ...formData, twoFactorSecret: secret });
    const qrUrl = TwoFactorAuth.getQRCodeURL(secret, formData.title || 'Account');
    setQrCodeUrl(qrUrl);
    setShowTwoFactor(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [...formData.customFields, { label: '', value: '', type: 'text' }]
    });
  };

  const updateCustomField = (index: number, field: Partial<typeof formData.customFields[0]>) => {
    const updated = [...formData.customFields];
    updated[index] = { ...updated[index], ...field };
    setFormData({ ...formData, customFields: updated });
  };

  const removeCustomField = (index: number) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordData = {
      ...formData,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      isCompromised,
      strength: passwordStrength,
      lastUsed: new Date(),
    };

    if (isEditMode) {
      const updatedPassword: PasswordEntry = {
        ...editingPassword,
        ...passwordData,
        updatedAt: new Date(),
      };
      updatePassword(updatedPassword);
    } else {
      addPassword(passwordData);
    }
    
    setEditingPassword(null);
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

  if (!editingPassword) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto transition-all duration-700 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white transition-all duration-500 delay-200 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          }`}>
            {isEditMode ? 'Edit Password' : 'Add New Password'}
          </h2>
          <button
            onClick={() => setEditingPassword(null)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className={`space-y-4 transition-all duration-500 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-slideInLeft stagger-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                  placeholder="e.g., Gmail Account"
                  required
                />
              </div>

              <div className="animate-slideInRight stagger-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="animate-slideInLeft stagger-3">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username/Email *
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                placeholder="username@example.com"
                required
              />
            </div>

            <div className="animate-slideInRight stagger-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                  placeholder="Enter password"
                  required
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                    title="Generate Password"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {formData.password && (
                <div className="mt-2 space-y-2 animate-slideDown">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                    <span className={`font-medium transition-colors duration-300 ${
                      passwordStrength < 30 ? 'text-red-600' :
                      passwordStrength < 60 ? 'text-yellow-600' :
                      passwordStrength < 80 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden progress-premium">
                    <div
                      className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-800 ease-out progress-bar`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  
                  {isCompromised && (
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm animate-shake">
                      <Shield className="w-4 h-4" />
                      <span>This password has been found in data breaches</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="animate-slideInLeft stagger-5">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL
              </label>
              <input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className={`space-y-4 transition-all duration-500 delay-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-slideInLeft stagger-6">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <div className="relative">
                  <input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-4 animate-slideInRight stagger-7">
                <label className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Add to favorites</span>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className="animate-slideInLeft stagger-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 animate-bounceIn hover:scale-110 transition-transform duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 btn-premium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="animate-slideInRight stagger-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Two-Factor Authentication
                </label>
                <button
                  type="button"
                  onClick={generateTwoFactorSecret}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 hover:scale-105"
                >
                  Generate Secret
                </button>
              </div>
              {formData.twoFactorSecret && (
                <div className="space-y-2 animate-slideDown">
                  <input
                    type="text"
                    value={formData.twoFactorSecret}
                    onChange={(e) => setFormData({ ...formData, twoFactorSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white font-mono text-sm input-premium"
                    placeholder="TOTP Secret Key"
                  />
                  {qrCodeUrl && (
                    <div className="text-center animate-scaleIn">
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto hover:scale-105 transition-transform duration-300" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Fields */}
            <div className="animate-slideInLeft stagger-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Fields
                </label>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.customFields.map((field, index) => (
                  <div key={index} className="flex space-x-2 animate-slideInRight" style={{ animationDelay: `${index * 100}ms` }}>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(index, { label: e.target.value })}
                      className="w-1/3 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                      placeholder="Field name"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateCustomField(index, { type: e.target.value as any })}
                      className="w-1/4 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                    >
                      <option value="text">Text</option>
                      <option value="password">Password</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={field.value}
                      onChange={(e) => updateCustomField(index, { value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                      placeholder="Field value"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="animate-slideInRight stagger-8">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white input-premium"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className={`flex space-x-3 pt-4 transition-all duration-500 delay-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              type="button"
              onClick={() => setEditingPassword(null)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 hover:scale-[1.02]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] btn-premium"
            >
              {isEditMode ? 'Update' : 'Save'} Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}