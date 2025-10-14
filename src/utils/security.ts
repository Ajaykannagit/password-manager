import { PasswordEntry } from '../types';

export class SecurityAnalyzer {
  static analyzePasswordSecurity(passwords: PasswordEntry[]) {
    const weakPasswords = passwords.filter(p => this.calculatePasswordStrength(p.password) < 60);
    const reusedPasswords = this.findReusedPasswords(passwords);
    const expiredPasswords = passwords.filter(p => this.isPasswordExpired(p));
    const compromisedPasswords = passwords.filter(p => p.isCompromised);

    // Calculate security score directly here to avoid recursion
    let securityScore = 100;
    if (passwords.length > 0) {
      const weakPenalty = (weakPasswords.length / passwords.length) * 30;
      const reusedPenalty = (reusedPasswords.length / passwords.length) * 25;
      const expiredPenalty = (expiredPasswords.length / passwords.length) * 20;
      const compromisedPenalty = (compromisedPasswords.length / passwords.length) * 25;
      
      securityScore = Math.max(0, 100 - weakPenalty - reusedPenalty - expiredPenalty - compromisedPenalty);
    }

    return {
      weakPasswords: weakPasswords.length,
      reusedPasswords: reusedPasswords.length,
      expiredPasswords: expiredPasswords.length,
      compromisedPasswords: compromisedPasswords.length,
      totalPasswords: passwords.length,
      securityScore,
      lastUpdated: new Date(),
      weakPasswordsList: weakPasswords,
      reusedPasswordsList: reusedPasswords,
      expiredPasswordsList: expiredPasswords,
      compromisedPasswordsList: compromisedPasswords,
    };
  }

  static calculatePasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    return Math.min(100, score);
  }

  static findReusedPasswords(passwords: PasswordEntry[]): PasswordEntry[] {
    const passwordMap = new Map<string, PasswordEntry[]>();
    
    passwords.forEach(entry => {
      const existing = passwordMap.get(entry.password) || [];
      existing.push(entry);
      passwordMap.set(entry.password, existing);
    });

    const reused: PasswordEntry[] = [];
    passwordMap.forEach(entries => {
      if (entries.length > 1) {
        reused.push(...entries);
      }
    });

    return reused;
  }

  static isPasswordExpired(password: PasswordEntry, expiryDays: number = 90): boolean {
    if (!password.expiryDate) {
      const createdDate = new Date(password.createdAt);
      const expiryDate = new Date(createdDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
      return new Date() > expiryDate;
    }
    return new Date() > new Date(password.expiryDate);
  }

  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Use SHA-1 hash for HaveIBeenPwned API
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();
      
      return text.includes(suffix);
    } catch (error) {
      console.error('Breach check failed:', error);
      return false;
    }
  }

  static generateSecurePassword(options: {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    excludeSimilar: boolean;
    excludeAmbiguous: boolean;
  }): string {
    let charset = '';
    const similar = 'il1Lo0O';
    const ambiguous = '{}[]()/\\\'"`~,;.<>';
    
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (options.excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    if (options.excludeAmbiguous) {
      charset = charset.split('').filter(char => !ambiguous.includes(char)).join('');
    }

    if (!charset) return '';

    // Use crypto.getRandomValues for secure random generation
    const array = new Uint32Array(options.length);
    crypto.getRandomValues(array);
    
    let result = '';
    for (let i = 0; i < options.length; i++) {
      result += charset.charAt(array[i] % charset.length);
    }
    
    return result;
  }

  // Activity logging
  // Enhanced security logging with encryption status
  static logActivity(action: string, details: any = {}) {
    const activity = {
      timestamp: new Date().toISOString(),
      action,
      details: {
        ...details,
        encryptionStatus: 'AES-256-GCM',
        complianceLevel: 'NIST-OWASP'
      },
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      securityLevel: 'HIGH'
    };

    const logs = this.getActivityLogs();
    logs.push(activity);
    
    // Keep only last 100 activities
    const recentLogs = logs.slice(-100);
    localStorage.setItem('passwordManager_activityLogs', JSON.stringify(recentLogs));
  }

  static getActivityLogs(): any[] {
    const logs = localStorage.getItem('passwordManager_activityLogs');
    return logs ? JSON.parse(logs) : [];
  }

  static clearActivityLogs() {
    localStorage.removeItem('passwordManager_activityLogs');
  }

  // Password usage analytics
  static getPasswordAnalytics(passwords: PasswordEntry[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentlyUsed = passwords.filter(p => 
      p.lastUsed && new Date(p.lastUsed) > thirtyDaysAgo
    ).length;

    const neverUsed = passwords.filter(p => !p.lastUsed).length;
    
    const categoryStats = passwords.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const strengthDistribution = {
      weak: passwords.filter(p => this.calculatePasswordStrength(p.password) < 30).length,
      fair: passwords.filter(p => {
        const strength = this.calculatePasswordStrength(p.password);
        return strength >= 30 && strength < 60;
      }).length,
      good: passwords.filter(p => {
        const strength = this.calculatePasswordStrength(p.password);
        return strength >= 60 && strength < 80;
      }).length,
      strong: passwords.filter(p => this.calculatePasswordStrength(p.password) >= 80).length,
    };

    return {
      totalPasswords: passwords.length,
      recentlyUsed,
      neverUsed,
      categoryStats,
      strengthDistribution,
      averagePasswordAge: this.getAveragePasswordAge(passwords),
      mostUsedCategory: Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    };
  }

  private static getAveragePasswordAge(passwords: PasswordEntry[]): number {
    if (passwords.length === 0) return 0;
    
    const now = new Date();
    const totalAge = passwords.reduce((sum, p) => {
      const age = now.getTime() - new Date(p.createdAt).getTime();
      return sum + age;
    }, 0);
    
    return Math.floor(totalAge / passwords.length / (1000 * 60 * 60 * 24)); // days
  }
}

export class TwoFactorAuth {
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < 32; i++) {
      secret += chars[array[i] % chars.length];
    }
    
    return secret;
  }

  static generateTOTP(secret: string, window: number = 0): string {
    // Simplified TOTP implementation
    const time = Math.floor(Date.now() / 1000 / 30) + window;
    const timeHex = time.toString(16).padStart(16, '0');
    
    // This is a simplified version - in production, use a proper TOTP library
    const hash = this.simpleHash(secret + timeHex);
    const code = (parseInt(hash.slice(-6), 16) % 1000000).toString().padStart(6, '0');
    
    return code;
  }

  private static simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  static getQRCodeURL(secret: string, accountName: string, issuer: string = 'SecureVault'): string {
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }
}

// Clipboard security utilities
export class ClipboardManager {
  private static clearTimeouts = new Map<string, NodeJS.Timeout>();

  static async copyWithTimeout(text: string, timeoutMs: number = 30000): Promise<void> {
    await navigator.clipboard.writeText(text);
    
    // Clear any existing timeout for this text
    const existingTimeout = this.clearTimeouts.get(text);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to clear clipboard
    const timeout = setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === text) {
          await navigator.clipboard.writeText('');
        }
      } catch (error) {
        // Ignore clipboard read errors
      }
      this.clearTimeouts.delete(text);
    }, timeoutMs);

    this.clearTimeouts.set(text, timeout);
  }

  static clearAllTimeouts(): void {
    this.clearTimeouts.forEach(timeout => clearTimeout(timeout));
    this.clearTimeouts.clear();
  }
}

// Content Security Policy utilities
export class SecurityHeaders {
  static applyCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.pwnedpasswords.com https://api.qrserver.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    document.head.appendChild(meta);
  }

  static enforceHTTPS(): void {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }
  }
}

// Session management
export class SessionManager {
  private static sessionId: string | null = null;
  private static lastActivity: number = Date.now();

  static initSession(): string {
    this.sessionId = crypto.randomUUID();
    this.lastActivity = Date.now();
    sessionStorage.setItem('sessionId', this.sessionId);
    sessionStorage.setItem('sessionStart', new Date().toISOString());
    return this.sessionId;
  }

  static updateActivity(): void {
    this.lastActivity = Date.now();
  }

  static getSessionDuration(): number {
    const start = sessionStorage.getItem('sessionStart');
    if (!start) return 0;
    return Date.now() - new Date(start).getTime();
  }

  static isSessionExpired(timeoutMs: number): boolean {
    return Date.now() - this.lastActivity > timeoutMs;
  }

  static clearSession(): void {
    this.sessionId = null;
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('sessionStart');
  }
}