export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  tags?: string[];
  lastUsed?: Date;
  expiryDate?: Date;
  isCompromised?: boolean;
  strength?: number;
  twoFactorSecret?: string;
  customFields?: { label: string; value: string; type: 'text' | 'password' | 'email' | 'url' }[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Settings {
  autoLockMinutes: number;
  theme: 'light' | 'dark' | 'auto';
  showPasswordStrength: boolean;
  compactView: boolean;
  enableBiometric: boolean;
  autoFillEnabled: boolean;
  passwordExpiryDays: number;
  enableBreachCheck: boolean;
  enableTwoFactor: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  language: string;
}

export interface AppState {
  isAuthenticated: boolean;
  passwords: PasswordEntry[];
  categories: Category[];
  searchQuery: string;
  selectedCategory: string | null;
  showPasswordGenerator: boolean;
  editingPassword: PasswordEntry | null;
  settings: Settings;
  securityReport?: SecurityReport;
}

export interface SecurityReport {
  weakPasswords: number;
  reusedPasswords: number;
  expiredPasswords: number;
  compromisedPasswords: number;
  totalPasswords: number;
  securityScore: number;
  lastUpdated: Date;
}

export interface BreachData {
  name: string;
  domain: string;
  breachDate: string;
  dataClasses: string[];
}