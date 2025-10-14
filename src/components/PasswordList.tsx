import React, { useMemo, useState, useEffect } from 'react';
import { Search, Copy, Edit, Trash2, Star, Eye, EyeOff, ExternalLink, Check, Globe, User, Mail, Clock, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PasswordEntry } from '../types';
import { ClipboardManager, SecurityAnalyzer } from '../utils/security';

export function PasswordList() {
  const {
    passwords,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setEditingPassword,
    deletePassword,
    updatePassword,
  } = useApp();

  const [visiblePasswords, setVisiblePasswords] = React.useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'category' | 'strength'>('updated');
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Log activity when passwords are accessed
  useEffect(() => {
    if (passwords.length > 0) {
      SecurityAnalyzer.logActivity('passwordListViewed', { 
        passwordCount: passwords.length,
        selectedCategory 
      });
    }
  }, [passwords.length, selectedCategory]);

  const filteredPasswords = useMemo(() => {
    let filtered = passwords;

    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(p => p.isFavorite);
    } else if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        p.url?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort passwords
    return filtered.sort((a, b) => {
      // Favorites always come first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'strength':
          const strengthA = getPasswordStrength(a.password);
          const strengthB = getPasswordStrength(b.password);
          return strengthB - strengthA;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [passwords, selectedCategory, searchQuery, sortBy]);

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
      SecurityAnalyzer.logActivity('passwordHidden', { passwordId: id });
    } else {
      newVisible.add(id);
      SecurityAnalyzer.logActivity('passwordViewed', { passwordId: id });
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, type: string, id: string) => {
    try {
      await ClipboardManager.copyWithTimeout(text, 30000); // Auto-clear after 30 seconds
      const key = `${id}-${type}`;
      setCopiedItems(prev => new Set([...prev, key]));
      
      // Log the copy activity
      SecurityAnalyzer.logActivity('passwordCopied', { 
        passwordId: id, 
        type,
        autoClears: true 
      });
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleFavorite = (password: PasswordEntry) => {
    const updated = { ...password, isFavorite: !password.isFavorite };
    updatePassword(updated);
    SecurityAnalyzer.logActivity('passwordFavoriteToggled', { 
      passwordId: password.id,
      isFavorite: updated.isFavorite 
    });
  };

  const handleDelete = (password: PasswordEntry) => {
    if (window.confirm(`Are you sure you want to delete "${password.title}"?`)) {
      deletePassword(password.id);
      SecurityAnalyzer.logActivity('passwordDeleted', { 
        passwordId: password.id,
        title: password.title 
      });
    }
  };

  const handleEdit = (password: PasswordEntry) => {
    setEditingPassword(password);
    SecurityAnalyzer.logActivity('passwordEditStarted', { passwordId: password.id });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#6B7280';
  };

  const getPasswordStrength = (password: string): number => {
    return SecurityAnalyzer.calculatePasswordStrength(password);
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthIcon = (strength: number) => {
    if (strength < 30) return <Shield className="w-3 h-3 text-red-500" />;
    if (strength < 60) return <Shield className="w-3 h-3 text-yellow-500" />;
    if (strength < 80) return <Shield className="w-3 h-3 text-blue-500" />;
    return <Shield className="w-3 h-3 text-green-500" />;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const isPasswordExpired = (password: PasswordEntry) => {
    return SecurityAnalyzer.isPasswordExpired(password);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className={`p-6 border-b border-gray-200 bg-white transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}>
        <div className="flex flex-col space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Search passwords, usernames, URLs, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 animate-fadeIn">
                {filteredPasswords.length} password{filteredPasswords.length !== 1 ? 's' : ''}
              </span>
              {selectedCategory === 'favorites' && (
                <span className="text-sm text-yellow-600 flex items-center animate-bounceIn">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  Favorites
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
                <option value="strength">Password Strength</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredPasswords.length === 0 ? (
          <div className={`text-center py-12 transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
          }`}>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No passwords found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first password to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPasswords.map((password, index) => {
              const strength = getPasswordStrength(password.password);
              const isExpired = isPasswordExpired(password);
              
              return (
                <div
                  key={password.id}
                  className={`bg-white border rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-gray-300 hover:scale-[1.01] transform ${
                    isExpired ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  } ${password.isCompromised ? 'border-red-300 bg-red-50' : ''} ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 50}ms`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{password.title}</h3>
                        <button
                          onClick={() => toggleFavorite(password)}
                          className={`p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            password.isFavorite
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${password.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        {getStrengthIcon(strength)}
                        {password.isCompromised && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs animate-pulse">
                            <Shield className="w-3 h-3" />
                            <span>Compromised</span>
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center space-x-1 text-yellow-600 text-xs animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Expired</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{password.username}</span>
                        </div>
                        {password.url && (
                          <a
                            href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105"
                            onClick={() => SecurityAnalyzer.logActivity('passwordUrlOpened', { passwordId: password.id })}
                          >
                            <Globe className="w-4 h-4" />
                            <span className="truncate max-w-xs">{password.url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Tags */}
                      {password.tags && password.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {password.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 animate-fadeIn"
                              style={{ animationDelay: `${tagIndex * 100}ms` }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: getCategoryColor(password.category) }}
                      >
                        {getCategoryName(password.category)}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(new Date(password.updatedAt))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 group">
                      <span className="text-sm text-gray-600 w-20 flex-shrink-0">Username:</span>
                      <code className="flex-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border transition-all duration-200 group-hover:bg-gray-100">
                        {password.username}
                      </code>
                      <button
                        onClick={() => copyToClipboard(password.username, 'username', password.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Copy username"
                      >
                        {copiedItems.has(`${password.id}-username`) ? (
                          <Check className="w-4 h-4 text-green-600 animate-bounceIn" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 group">
                      <span className="text-sm text-gray-600 w-20 flex-shrink-0">Password:</span>
                      <div className="flex-1">
                        <code className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border block transition-all duration-200 group-hover:bg-gray-100">
                          {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
                        </code>
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getStrengthColor(strength)} transition-all duration-500 ease-out`}
                              style={{ width: `${strength}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {strength < 30 ? 'Weak' : strength < 60 ? 'Fair' : strength < 80 ? 'Good' : 'Strong'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => togglePasswordVisibility(password.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title={visiblePasswords.has(password.id) ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords.has(password.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(password.password, 'password', password.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Copy password (auto-clears in 30s)"
                        >
                          {copiedItems.has(`${password.id}-password`) ? (
                            <Check className="w-4 h-4 text-green-600 animate-bounceIn" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Custom Fields */}
                    {password.customFields && password.customFields.length > 0 && (
                      <div className="space-y-2">
                        {password.customFields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-center space-x-3 group animate-fadeIn" style={{ animationDelay: `${fieldIndex * 100}ms` }}>
                            <span className="text-sm text-gray-600 w-20 flex-shrink-0">{field.label}:</span>
                            <code className="flex-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border transition-all duration-200 group-hover:bg-gray-100">
                              {field.type === 'password' ? '••••••••' : field.value}
                            </code>
                            <button
                              onClick={() => copyToClipboard(field.value, field.label, password.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title={`Copy ${field.label}`}
                            >
                              {copiedItems.has(`${password.id}-${field.label}`) ? (
                                <Check className="w-4 h-4 text-green-600 animate-bounceIn" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {password.notes && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-start space-x-3 group">
                          <span className="text-sm text-gray-600 w-20 flex-shrink-0 mt-1">Notes:</span>
                          <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg flex-1 transition-all duration-200 group-hover:bg-gray-100">
                            {password.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(password)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Edit password"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(password)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete password"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}