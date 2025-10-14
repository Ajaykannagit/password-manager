import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, PasswordEntry, Category, Settings } from '../types';
import { CryptoManager, BiometricManager } from '../utils/crypto';

interface AppContextType extends AppState {
  login: (masterPassword: string) => Promise<boolean>;
  signup: (masterPassword: string) => Promise<boolean>;
  logout: () => void;
  addPassword: (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePassword: (password: PasswordEntry) => void;
  deletePassword: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setShowPasswordGenerator: (show: boolean) => void;
  setEditingPassword: (password: PasswordEntry | null) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  exportData: () => void;
  importData: (data: any) => void;
  clearAllData: () => void;
  getCurrentUser: () => string | null;
  getAllUsers: () => string[];
  deleteUser: (userHash: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const defaultCategories: Category[] = [
  { id: '1', name: 'Personal', color: '#3B82F6', icon: 'User' },
  { id: '2', name: 'Work', color: '#EF4444', icon: 'Briefcase' },
  { id: '3', name: 'Social', color: '#10B981', icon: 'Users' },
  { id: '4', name: 'Finance', color: '#F59E0B', icon: 'CreditCard' },
  { id: '5', name: 'Shopping', color: '#8B5CF6', icon: 'ShoppingBag' },
];

const defaultSettings: Settings = {
  autoLockMinutes: 15,
  theme: 'light',
  showPasswordStrength: true,
  compactView: false,
  enableBiometric: false,
  autoFillEnabled: true,
  passwordExpiryDays: 90,
  enableBreachCheck: true,
  enableTwoFactor: false,
  backupFrequency: 'weekly',
  language: 'en',
};

const initialState: AppState = {
  isAuthenticated: false,
  passwords: [],
  categories: defaultCategories,
  searchQuery: '',
  selectedCategory: null,
  showPasswordGenerator: false,
  editingPassword: null,
  settings: defaultSettings,
};

type Action =
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORDS'; payload: PasswordEntry[] }
  | { type: 'ADD_PASSWORD'; payload: PasswordEntry }
  | { type: 'UPDATE_PASSWORD'; payload: PasswordEntry }
  | { type: 'DELETE_PASSWORD'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null }
  | { type: 'SET_SHOW_PASSWORD_GENERATOR'; payload: boolean }
  | { type: 'SET_EDITING_PASSWORD'; payload: PasswordEntry | null }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'CLEAR_ALL_DATA' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_PASSWORDS':
      return { ...state, passwords: action.payload };
    case 'ADD_PASSWORD':
      return { ...state, passwords: [...state.passwords, action.payload] };
    case 'UPDATE_PASSWORD':
      return {
        ...state,
        passwords: state.passwords.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PASSWORD':
      return {
        ...state,
        passwords: state.passwords.filter(p => p.id !== action.payload)
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SHOW_PASSWORD_GENERATOR':
      return { ...state, showPasswordGenerator: action.payload };
    case 'SET_EDITING_PASSWORD':
      return { ...state, editingPassword: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'CLEAR_ALL_DATA':
      return { ...initialState, isAuthenticated: true };
    default:
      return state;
  }
}

// Theme utility functions
const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// User management utilities
const getUserHash = async (masterPassword: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(masterPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getUserStorageKey = (userHash: string): string => {
  return `passwordManager_${userHash}`;
};

const getUsersListKey = (): string => {
  return 'passwordManager_users';
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Apply theme when settings change
  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (state.settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [state.settings.theme]);

  const getCurrentUser = (): string | null => {
    return sessionStorage.getItem('currentUserHash');
  };

  const getAllUsers = (): string[] => {
    const usersData = localStorage.getItem(getUsersListKey());
    return usersData ? JSON.parse(usersData) : [];
  };

  const addUserToList = (userHash: string, masterPassword: string) => {
    const users = getAllUsers();
    const userInfo = {
      hash: userHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Store a hint based on the master password (first 3 chars + length)
      hint: `${masterPassword.substring(0, 3)}... (${masterPassword.length} chars)`
    };
    
    const existingIndex = users.findIndex((u: any) => u.hash === userHash);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], lastLogin: new Date().toISOString() };
    } else {
      users.push(userInfo);
    }
    
    localStorage.setItem(getUsersListKey(), JSON.stringify(users));
  };

  const signup = async (masterPassword: string): Promise<boolean> => {
    try {
      const userHash = await getUserHash(masterPassword);
      const userStorageKey = getUserStorageKey(userHash);
      
      // Check if this user already exists
      const existingData = localStorage.getItem(userStorageKey);
      if (existingData) {
        throw new Error('Account with this master password already exists');
      }

      // Create new encrypted vault for this user
      const initialData = {
        passwords: [],
        categories: defaultCategories,
        settings: defaultSettings,
        createdAt: new Date().toISOString(),
        version: '2.0'
      };

      const dataString = JSON.stringify(initialData);
      const encrypted = await CryptoManager.encrypt(dataString, masterPassword);
      localStorage.setItem(userStorageKey, encrypted);
      
      // Add user to the users list
      addUserToList(userHash, masterPassword);
      
      sessionStorage.setItem('masterPassword', masterPassword);
      sessionStorage.setItem('currentUserHash', userHash);
      dispatch({ type: 'SET_PASSWORDS', payload: [] });
      dispatch({ type: 'LOGIN' });
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const login = async (masterPassword: string): Promise<boolean> => {
    try {
      // Special case for biometric authentication
      if (masterPassword === '' && await BiometricManager.isAvailable()) {
        // Handle biometric login flow
        const userHandle = await BiometricManager.authenticate();
        if (userHandle) {
          const fallbackData = await BiometricManager.retrieveFallbackData(userHandle);
          if (fallbackData) {
            // Restore session from biometric fallback
            sessionStorage.setItem('currentUserHash', userHandle);
            dispatch({ type: 'LOGIN' });
            return true;
          }
        }
        return false;
      }

      const userHash = await getUserHash(masterPassword);
      const userStorageKey = getUserStorageKey(userHash);
      const encryptedData = localStorage.getItem(userStorageKey);
      
      if (!encryptedData) {
        return false; // No account exists for this master password
      }

      try {
        const decryptedData = await CryptoManager.decrypt(encryptedData, masterPassword);
        const data = JSON.parse(decryptedData);
        
        dispatch({ type: 'SET_PASSWORDS', payload: data.passwords || [] });
        if (data.settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings });
        }
        
        // Update last login time
        addUserToList(userHash, masterPassword);
        
        sessionStorage.setItem('masterPassword', masterPassword);
        sessionStorage.setItem('currentUserHash', userHash);
        
        // Store biometric fallback if available and not already stored
        if (await BiometricManager.isAvailable()) {
          try {
            await BiometricManager.storeFallbackData(userHash, encryptedData);
          } catch (error) {
            console.log('Biometric fallback storage failed:', error);
          }
        }
        
        dispatch({ type: 'LOGIN' });
        return true;
      } catch (decryptError) {
        console.error('Invalid master password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('masterPassword');
    sessionStorage.removeItem('currentUserHash');
    dispatch({ type: 'LOGOUT' });
  };

  const saveData = async (passwords: PasswordEntry[], settings: Settings) => {
    const masterPassword = sessionStorage.getItem('masterPassword');
    const currentUserHash = sessionStorage.getItem('currentUserHash');
    
    if (masterPassword && currentUserHash) {
      try {
        const data = JSON.stringify({ 
          passwords, 
          categories: state.categories,
          settings,
          lastModified: new Date().toISOString(),
          version: '2.0'
        });
        const encrypted = await CryptoManager.encrypt(data, masterPassword);
        const userStorageKey = getUserStorageKey(currentUserHash);
        localStorage.setItem(userStorageKey, encrypted);
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    }
  };

  const addPassword = (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPassword: PasswordEntry = {
      ...passwordData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_PASSWORD', payload: newPassword });
  };

  const updatePassword = (password: PasswordEntry) => {
    const updatedPassword = { ...password, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_PASSWORD', payload: updatedPassword });
  };

  const deletePassword = (id: string) => {
    dispatch({ type: 'DELETE_PASSWORD', payload: id });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setSelectedCategory = (categoryId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: categoryId });
  };

  const setShowPasswordGenerator = (show: boolean) => {
    dispatch({ type: 'SET_SHOW_PASSWORD_GENERATOR', payload: show });
  };

  const setEditingPassword = (password: PasswordEntry | null) => {
    dispatch({ type: 'SET_EDITING_PASSWORD', payload: password });
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  const exportData = () => {
    const currentUserHash = getCurrentUser();
    const dataToExport = {
      passwords: state.passwords,
      categories: state.categories,
      settings: state.settings,
      exportDate: new Date().toISOString(),
      userHash: currentUserHash,
      version: '2.0'
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `securevault-backup-${currentUserHash?.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (data: any) => {
    if (data.passwords && Array.isArray(data.passwords)) {
      const existingIds = new Set(state.passwords.map(p => p.id));
      const newPasswords = data.passwords.filter((p: PasswordEntry) => !existingIds.has(p.id));
      
      dispatch({ type: 'SET_PASSWORDS', payload: [...state.passwords, ...newPasswords] });
      
      if (data.settings) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings });
      }
    }
  };

  const clearAllData = () => {
    const currentUserHash = getCurrentUser();
    if (currentUserHash) {
      const userStorageKey = getUserStorageKey(currentUserHash);
      localStorage.removeItem(userStorageKey);
      
      // Remove user from users list
      const users = getAllUsers();
      const updatedUsers = users.filter((u: any) => u.hash !== currentUserHash);
      localStorage.setItem(getUsersListKey(), JSON.stringify(updatedUsers));
    }
    dispatch({ type: 'CLEAR_ALL_DATA' });
  };

  const deleteUser = (userHash: string) => {
    const userStorageKey = getUserStorageKey(userHash);
    localStorage.removeItem(userStorageKey);
    
    // Remove user from users list
    const users = getAllUsers();
    const updatedUsers = users.filter((u: any) => u.hash !== userHash);
    localStorage.setItem(getUsersListKey(), JSON.stringify(updatedUsers));
  };

  // Auto-lock functionality
  useEffect(() => {
    if (state.isAuthenticated && state.settings.autoLockMinutes > 0) {
      let timeout: NodeJS.Timeout;
      
      const resetTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          logout();
        }, state.settings.autoLockMinutes * 60 * 1000);
      };

      resetTimeout();

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetTimeout, true);
      });

      return () => {
        clearTimeout(timeout);
        events.forEach(event => {
          document.removeEventListener(event, resetTimeout, true);
        });
      };
    }
  }, [state.isAuthenticated, state.settings.autoLockMinutes]);

  useEffect(() => {
    if (state.isAuthenticated) {
      saveData(state.passwords, state.settings);
    }
  }, [state.passwords, state.settings, state.isAuthenticated]);

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      signup,
      logout,
      addPassword,
      updatePassword,
      deletePassword,
      setSearchQuery,
      setSelectedCategory,
      setShowPasswordGenerator,
      setEditingPassword,
      addCategory,
      updateSettings,
      exportData,
      importData,
      clearAllData,
      getCurrentUser,
      getAllUsers,
      deleteUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}