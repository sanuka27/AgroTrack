import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import logger from './logger';

/**
 * Firebase Admin SDK Configuration for AgroTrack
 * Handles Firebase initialization, authentication, and services
 */

interface FirebaseConfig {
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientX509CertUrl: string;
}

class FirebaseService {
  private static instance: FirebaseService;
  private app: admin.app.App | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Firebase already initialized');
      return;
    }

    try {
      const firebaseConfig = this.getFirebaseConfig();
      
      if (!firebaseConfig) {
        logger.warn('Firebase configuration not found - running in offline mode');
        this.isInitialized = true; // Mark as initialized even without Firebase
        return;
      }

      // Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as ServiceAccount),
        projectId: firebaseConfig.projectId,
        storageBucket: `${firebaseConfig.projectId}.appspot.com`,
        databaseURL: `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com/`
      });

      this.isInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully', {
        projectId: firebaseConfig.projectId
      });
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error });
      throw error;
    }
  }

  /**
   * Get Firebase configuration from environment variables
   */
  private getFirebaseConfig(): FirebaseConfig | null {
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID,
      FIREBASE_AUTH_URI,
      FIREBASE_TOKEN_URI,
      FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      FIREBASE_CLIENT_X509_CERT_URL
    } = process.env;

    // Check if running with service account key file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      logger.info('Using GOOGLE_APPLICATION_CREDENTIALS for Firebase authentication');
      return null; // Firebase SDK will automatically use the service account key file
    }

    // Check if all required environment variables are present
    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
      logger.warn('Firebase configuration incomplete, some features may not work');
      return null;
    }

    return {
      projectId: FIREBASE_PROJECT_ID,
      privateKeyId: FIREBASE_PRIVATE_KEY_ID || '',
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: FIREBASE_CLIENT_EMAIL,
      clientId: FIREBASE_CLIENT_ID || '',
      authUri: FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl: FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      clientX509CertUrl: FIREBASE_CLIENT_X509_CERT_URL || ''
    };
  }

  /**
   * Get Firebase Admin App instance
   */
  getApp(): admin.app.App {
    if (!this.app || !this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.app;
  }

  /**
   * Check if Firebase is available
   */
  isFirebaseAvailable(): boolean {
    return this.app !== null && this.isInitialized;
  }

  /**
   * Get Firebase Auth service
   */
  getAuth(): admin.auth.Auth {
    return this.getApp().auth();
  }

  /**
   * Get Firebase Firestore service
   */
  getFirestore(): admin.firestore.Firestore {
    return this.getApp().firestore();
  }

  /**
   * Get Firebase Storage service
   */
  getStorage(): admin.storage.Storage {
    return this.getApp().storage();
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase not available - running in offline mode');
    }
    
    try {
      const decodedToken = await this.getAuth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      logger.error('Failed to verify Firebase ID token', { error });
      throw new Error('Invalid Firebase ID token');
    }
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      const customToken = await this.getAuth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      logger.error('Failed to create custom token', { error, uid });
      throw new Error('Failed to create custom token');
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().getUser(uid);
      return userRecord;
    } catch (error) {
      logger.error('Failed to get user by UID', { error, uid });
      throw new Error('User not found');
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase not available - running in offline mode');
    }
    
    try {
      const userRecord = await this.getAuth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      logger.error('Failed to get user by email', { error, email });
      throw new Error('User not found');
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    email: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
    disabled?: boolean;
  }): Promise<admin.auth.UserRecord> {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase not available - running in offline mode');
    }
    
    try {
      const userRecord = await this.getAuth().createUser(userData);
      logger.info('Firebase user created successfully', { uid: userRecord.uid, email: userData.email });
      return userRecord;
    } catch (error) {
      logger.error('Failed to create Firebase user', { error, email: userData.email });
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(uid: string, userData: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
    disabled?: boolean;
  }): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await this.getAuth().updateUser(uid, userData);
      logger.info('Firebase user updated successfully', { uid });
      return userRecord;
    } catch (error) {
      logger.error('Failed to update Firebase user', { error, uid });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.getAuth().deleteUser(uid);
      logger.info('Firebase user deleted successfully', { uid });
    } catch (error) {
      logger.error('Failed to delete Firebase user', { error, uid });
      throw error;
    }
  }

  /**
   * Set custom user claims (for role-based access)
   */
  async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    if (!this.isFirebaseAvailable()) {
      logger.warn('Firebase not available - skipping custom claims setup');
      return;
    }
    
    try {
      await this.getAuth().setCustomUserClaims(uid, customClaims);
      logger.info('Custom user claims set successfully', { uid, claims: customClaims });
    } catch (error) {
      logger.error('Failed to set custom user claims', { error, uid });
      throw error;
    }
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    fileName: string,
    metadata?: {
      contentType?: string;
      customMetadata?: { [key: string]: string };
    }
  ): Promise<{ downloadURL: string; fullPath: string }> {
    try {
      const bucket = this.getStorage().bucket();
      const fileRef = bucket.file(fileName);

      await fileRef.save(file, {
        metadata: {
          contentType: metadata?.contentType || 'application/octet-stream',
          metadata: metadata?.customMetadata || {}
        }
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      logger.info('File uploaded to Firebase Storage successfully', { fileName, downloadURL });

      return {
        downloadURL,
        fullPath: fileRef.name
      };
    } catch (error) {
      logger.error('Failed to upload file to Firebase Storage', { error, fileName });
      throw error;
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.getStorage().bucket();
      await bucket.file(fileName).delete();
      logger.info('File deleted from Firebase Storage successfully', { fileName });
    } catch (error) {
      logger.error('Failed to delete file from Firebase Storage', { error, fileName });
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string): Promise<string> {
    try {
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/verify-email`,
        handleCodeInApp: true
      };

      const link = await this.getAuth().generateEmailVerificationLink(email, actionCodeSettings);
      logger.info('Email verification link generated', { email });
      return link;
    } catch (error) {
      logger.error('Failed to generate email verification link', { error, email });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<string> {
    try {
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/reset-password`,
        handleCodeInApp: true
      };

      const link = await this.getAuth().generatePasswordResetLink(email, actionCodeSettings);
      logger.info('Password reset link generated', { email });
      return link;
    } catch (error) {
      logger.error('Failed to generate password reset link', { error, email });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; projectId: string; services: string[] }> {
    try {
      if (!this.isInitialized || !this.app) {
        throw new Error('Firebase not initialized');
      }

      // Test Firebase Auth
      await this.getAuth().listUsers(1);

      return {
        status: 'healthy',
        projectId: this.app.options.projectId || 'unknown',
        services: ['auth', 'firestore', 'storage']
      };
    } catch (error) {
      logger.error('Firebase health check failed', { error });
      return {
        status: 'unhealthy',
        projectId: 'unknown',
        services: []
      };
    }
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
export default firebaseService;