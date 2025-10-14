// NIST-compliant AES-256 encryption with PBKDF2 key derivation
// Following OWASP and NIST SP 800-132, SP 800-38D guidelines

export class CryptoManager {
  // NIST SP 800-132 recommended minimum iterations (2023)
  private static readonly PBKDF2_ITERATIONS = 210000;
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits for AES-GCM
  private static readonly KEY_LENGTH = 32; // 256 bits for AES-256

  /**
   * Derives encryption key from password using PBKDF2-SHA256
   * Follows NIST SP 800-132 recommendations
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES-256 key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: this.KEY_LENGTH * 8 // 256 bits
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts data using AES-256-GCM with authenticated encryption
   * Follows NIST SP 800-38D recommendations
   */
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate cryptographically secure random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Derive encryption key
      const key = await this.deriveKey(password, salt);
      
      // Encrypt with AES-256-GCM (provides both confidentiality and authenticity)
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128 // 128-bit authentication tag
        },
        key,
        dataBuffer
      );
      
      // Combine salt + iv + encrypted data for storage
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(encryptedArray, salt.length + iv.length);
      
      // Return base64 encoded result
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts data using AES-256-GCM with authentication verification
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const encryptedBuffer = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);
      
      // Derive decryption key
      const key = await this.deriveKey(password, salt);
      
      // Decrypt with AES-256-GCM (automatically verifies authentication tag)
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        encryptedBuffer
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Invalid password or corrupted data');
    }
  }

  /**
   * Securely wipes sensitive data from memory (best effort)
   * Note: JavaScript doesn't guarantee memory wiping, but this helps
   */
  static secureWipe(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string memory (limited effectiveness in JS)
      for (let i = 0; i < data.length; i++) {
        data = data.substring(0, i) + '\0' + data.substring(i + 1);
      }
    } else if (data instanceof Uint8Array) {
      // Zero out typed arrays
      data.fill(0);
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

/**
 * Biometric Authentication Manager using WebAuthn API
 * Follows OWASP ASVS and FIDO2 standards
 */
export class BiometricManager {
  private static readonly RP_NAME = 'SecureVault Password Manager';
  private static readonly RP_ID = window.location.hostname;
  
  /**
   * Checks if biometric authentication is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return false;
      }
      
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  /**
   * Registers a new biometric credential
   */
  static async register(userHandle: string): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Biometric authentication not available');
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(userHandle);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: this.RP_NAME,
            id: this.RP_ID,
          },
          user: {
            id: userId,
            name: userHandle,
            displayName: 'SecureVault User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: true,
          },
          timeout: 60000,
          attestation: 'direct',
        },
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        localStorage.setItem(`biometric_${userHandle}`, credential.id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }

  /**
   * Authenticates using biometric credential
   */
  static async authenticate(): Promise<string | null> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('Biometric authentication not available');
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [], // Allow any registered credential
        },
      }) as PublicKeyCredential;

      if (credential && credential.response) {
        // Extract user handle from authentication response
        const response = credential.response as AuthenticatorAssertionResponse;
        if (response.userHandle) {
          const userHandle = new TextDecoder().decode(response.userHandle);
          return userHandle;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  }

  /**
   * Stores encrypted fallback data for biometric recovery
   */
  static async storeFallbackData(userHandle: string, encryptedData: string): Promise<void> {
    try {
      // Store encrypted vault data that can be recovered via biometric auth
      const fallbackKey = `biometric_fallback_${userHandle}`;
      localStorage.setItem(fallbackKey, encryptedData);
    } catch (error) {
      console.error('Failed to store biometric fallback data:', error);
      throw error;
    }
  }

  /**
   * Retrieves encrypted fallback data for biometric recovery
   */
  static async retrieveFallbackData(userHandle: string): Promise<string | null> {
    try {
      const fallbackKey = `biometric_fallback_${userHandle}`;
      return localStorage.getItem(fallbackKey);
    } catch (error) {
      console.error('Failed to retrieve biometric fallback data:', error);
      return null;
    }
  }

  /**
   * Removes biometric credentials and fallback data
   */
  static async removeBiometric(userHandle: string): Promise<void> {
    try {
      localStorage.removeItem(`biometric_${userHandle}`);
      localStorage.removeItem(`biometric_fallback_${userHandle}`);
    } catch (error) {
      console.error('Failed to remove biometric data:', error);
    }
  }
}

/**
 * Enhanced Activity Logger with encryption status
 */
export class ActivityLogger {
  private static readonly LOG_KEY = 'securevault_activity_log';
  private static readonly MAX_LOG_ENTRIES = 1000;

  static log(action: string, details?: any): void {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        action,
        details: details || {},
        userAgent: navigator.userAgent,
        encryptionStatus: 'AES-256-GCM',
        sessionId: this.getSessionId(),
      };

      const logs = this.getLogs();
      logs.unshift(entry);

      // Keep only the most recent entries
      if (logs.length > this.MAX_LOG_ENTRIES) {
        logs.splice(this.MAX_LOG_ENTRIES);
      }

      localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static getLogs(): any[] {
    try {
      const logs = localStorage.getItem(this.LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  static clearLogs(): void {
    try {
      localStorage.removeItem(this.LOG_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}