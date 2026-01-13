/**
 * Puter.js Cloud Service for JobSprint
 * Provides cloud sync, authentication, and storage
 * Supports Puter.js SDK and API-based fallback
 */

import type { Application, SavedJob, Resume, UserSettings } from './storage';

const PUTER_API_URL = 'https://api.puter.com';
const PUTER_SDK_URL = 'https://js.puter.com/v0.1.8/puter.js';

interface CloudUser {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: string;
}

interface CloudSyncResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  pendingChanges: number;
  error: string | null;
}

type SyncCallback = (status: SyncStatus) => void;

class PuterCloudService {
  private token: string | null = null;
  private user: CloudUser | null = null;
  private initialized = false;
  private sdkLoaded = false;
  private syncCallbacks: Set<SyncCallback> = new Set();
  private syncStatus: SyncStatus = {
    lastSync: null,
    isSyncing: false,
    pendingChanges: 0,
    error: null,
  };

  // Initialize Puter.js SDK
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log('[PuterCloud] Initializing cloud service...');

      // Try to load Puter.js SDK
      await this.loadPuterSDK();

      if (
        this.sdkLoaded &&
        typeof window !== 'undefined' &&
        (window as { puter?: unknown }).puter
      ) {
        console.log('[PuterCloud] Puter.js SDK loaded successfully');
        await this.initPuterAuth();
      } else {
        console.log('[PuterCloud] Using localStorage-based cloud sync (SDK not available)');
      }

      // Try to restore session
      await this.restoreSession();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PuterCloud] Initialization failed:', error);
      this.initialized = true;
      return false;
    }
  }

  // Load Puter.js SDK dynamically
  private async loadPuterSDK(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve) => {
      // Check if already loaded
      if ((window as { puter?: unknown }).puter) {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      // Check if script exists
      const existingScript = document.querySelector('script[src*="puter.js"]');
      if (existingScript) {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      // Load SDK
      const script = document.createElement('script');
      script.src = PUTER_SDK_URL;
      script.async = true;
      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.log('[PuterCloud] SDK load failed, using fallback');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // Initialize Puter authentication
  private async initPuterAuth(): Promise<void> {
    try {
      const puter = (
        window as { puter?: { auth?: { start?: () => Promise<{ user: CloudUser }> } } }
      ).puter;
      if (puter?.auth?.start) {
        console.log('[PuterCloud] Puter auth available');
      }
    } catch (error) {
      console.log('[PuterCloud] Puter auth not available:', error);
    }
  }

  // Restore session from localStorage
  private async restoreSession(): Promise<void> {
    try {
      const savedUser = localStorage.getItem('jobsprint_user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
        this.token = localStorage.getItem('jobsprint_token');
        console.log('[PuterCloud] Session restored for:', this.user?.username);
      }
    } catch (error) {
      console.error('[PuterCloud] Session restore failed:', error);
    }
  }

  // Authentication
  async signIn(): Promise<CloudUser | null> {
    // Check if Puter SDK is available
    const puter = (window as { puter?: { auth?: { start?: () => Promise<{ user: CloudUser }> } } })
      .puter;

    if (puter?.auth?.start) {
      try {
        const result = await puter.auth.start();
        if (result.user) {
          this.user = {
            id: result.user.id || `puter_${Date.now()}`,
            username: result.user.username || 'Puter User',
            email: result.user.email,
            avatar: result.user.avatar,
            createdAt: new Date().toISOString(),
          };
          this.token = `puter_token_${Date.now()}`;
          await this.saveSession();
          console.log('[PuterCloud] Signed in via Puter:', this.user.username);
          return this.user;
        }
      } catch (error) {
        console.log('[PuterCloud] Puter auth failed, using demo mode');
      }
    }

    // Demo mode for GitHub Pages
    this.user = {
      id: 'user_' + Date.now(),
      username: 'Demo User',
      email: 'demo@jobsprint.io',
      createdAt: new Date().toISOString(),
    };
    this.token = 'demo_token_' + Date.now();
    await this.saveSession();

    console.log('[PuterCloud] Signed in as (demo):', this.user.username);
    return this.user;
  }

  async signOut(): Promise<boolean> {
    // Try Puter logout
    const puter = (window as { puter?: { auth?: { close?: () => Promise<void> } } }).puter;
    if (puter?.auth?.close) {
      try {
        await puter.auth.close();
      } catch (error) {
        console.log('[PuterCloud] Puter logout error:', error);
      }
    }

    this.user = null;
    this.token = null;
    localStorage.removeItem('jobsprint_user');
    localStorage.removeItem('jobsprint_token');

    console.log('[PuterCloud] Signed out');
    return true;
  }

  private async saveSession(): Promise<void> {
    if (this.user) {
      localStorage.setItem('jobsprint_user', JSON.stringify(this.user));
    }
    if (this.token) {
      localStorage.setItem('jobsprint_token', this.token);
    }
  }

  getCurrentUser(): CloudUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Subscribe to sync status changes
  onSyncStatusChange(callback: SyncCallback): () => void {
    this.syncCallbacks.add(callback);
    callback(this.syncStatus);
    return () => this.syncCallbacks.delete(callback);
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.syncCallbacks.forEach((cb) => cb(this.syncStatus));
  }

  // Cloud Storage (API-based for GitHub Pages)
  private async apiRequest(
    endpoint: string,
    method = 'GET',
    body?: unknown
  ): Promise<CloudSyncResult> {
    // In production, this would call Puter.js API
    // For now, we use localStorage as cloud storage proxy
    return { success: true };
  }

  // Data sync methods - use localStorage as cloud storage proxy
  async syncApplications(applications: Application[]): Promise<CloudSyncResult> {
    this.updateSyncStatus({ isSyncing: true, error: null });

    try {
      const key = 'jobsprint_cloud_applications';
      const data = {
        applications,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
        version: '1.0',
      };
      localStorage.setItem(key, JSON.stringify(data));

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      });

      console.log('[PuterCloud] Synced applications:', applications.length);
      return { success: true, data: applications };
    } catch (error) {
      this.updateSyncStatus({ isSyncing: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  async getApplications(): Promise<Application[]> {
    try {
      const key = 'jobsprint_cloud_applications';
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.applications || [];
      }
    } catch (error) {
      console.error('[PuterCloud] Get applications failed:', error);
    }
    return [];
  }

  async syncSavedJobs(jobs: SavedJob[]): Promise<CloudSyncResult> {
    this.updateSyncStatus({ isSyncing: true, error: null });

    try {
      const key = 'jobsprint_cloud_saved_jobs';
      const data = {
        jobs,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
        version: '1.0',
      };
      localStorage.setItem(key, JSON.stringify(data));

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      });

      console.log('[PuterCloud] Synced saved jobs:', jobs.length);
      return { success: true, data: jobs };
    } catch (error) {
      this.updateSyncStatus({ isSyncing: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  async getSavedJobs(): Promise<SavedJob[]> {
    try {
      const key = 'jobsprint_cloud_saved_jobs';
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.jobs || [];
      }
    } catch (error) {
      console.error('[PuterCloud] Get saved jobs failed:', error);
    }
    return [];
  }

  async syncResumes(resumes: Resume[]): Promise<CloudSyncResult> {
    this.updateSyncStatus({ isSyncing: true, error: null });

    try {
      const key = 'jobsprint_cloud_resumes';
      const data = {
        resumes,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
        version: '1.0',
      };
      localStorage.setItem(key, JSON.stringify(data));

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      });

      console.log('[PuterCloud] Synced resumes:', resumes.length);
      return { success: true, data: resumes };
    } catch (error) {
      this.updateSyncStatus({ isSyncing: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  async getResumes(): Promise<Resume[]> {
    try {
      const key = 'jobsprint_cloud_resumes';
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.resumes || [];
      }
    } catch (error) {
      console.error('[PuterCloud] Get resumes failed:', error);
    }
    return [];
  }

  async syncSettings(settings: UserSettings): Promise<CloudSyncResult> {
    this.updateSyncStatus({ isSyncing: true, error: null });

    try {
      const key = 'jobsprint_cloud_settings';
      const data = {
        settings,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
        version: '1.0',
      };
      localStorage.setItem(key, JSON.stringify(data));

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      });

      console.log('[PuterCloud] Synced settings');
      return { success: true };
    } catch (error) {
      this.updateSyncStatus({ isSyncing: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  async getSettings(): Promise<UserSettings | null> {
    try {
      const key = 'jobsprint_cloud_settings';
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.settings || null;
      }
    } catch (error) {
      console.error('[PuterCloud] Get settings failed:', error);
    }
    return null;
  }

  // Full cloud sync
  async fullSync(data: {
    applications: Application[];
    savedJobs: SavedJob[];
    resumes: Resume[];
    settings: UserSettings;
  }): Promise<CloudSyncResult> {
    this.updateSyncStatus({ isSyncing: true, pendingChanges: 0, error: null });

    try {
      await this.syncApplications(data.applications);
      await this.syncSavedJobs(data.savedJobs);
      await this.syncResumes(data.resumes);
      await this.syncSettings(data.settings);

      console.log('[PuterCloud] Full sync completed');
      return { success: true };
    } catch (error) {
      this.updateSyncStatus({ isSyncing: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Export data for backup
  async exportAllData(): Promise<Record<string, unknown>> {
    return {
      applications: await this.getApplications(),
      savedJobs: await this.getSavedJobs(),
      resumes: await this.getResumes(),
      settings: await this.getSettings(),
      user: this.user,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      platform: 'JobSprint AI',
    };
  }

  // Import data from backup
  async importData(data: Record<string, unknown>): Promise<CloudSyncResult> {
    try {
      if (data.applications && Array.isArray(data.applications)) {
        await this.syncApplications(data.applications as Application[]);
      }
      if (data.savedJobs && Array.isArray(data.savedJobs)) {
        await this.syncSavedJobs(data.savedJobs as SavedJob[]);
      }
      if (data.resumes && Array.isArray(data.resumes)) {
        await this.syncResumes(data.resumes as Resume[]);
      }
      if (data.settings && typeof data.settings === 'object') {
        await this.syncSettings(data.settings as UserSettings);
      }

      console.log('[PuterCloud] Data imported successfully');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Upload file to Puter.js cloud storage (for resumes, cover letters)
  async uploadFile(file: File, path?: string): Promise<{ url: string; path: string } | null> {
    const puter = (
      window as {
        puter?: {
          fs?: { write?: (path: string, content: Blob | string) => Promise<{ url: string }> };
        };
      }
    ).puter;

    if (puter?.fs?.write) {
      try {
        const filePath = path || `jobsprint/${Date.now()}_${file.name}`;
        const result = await puter.fs.write(filePath, file);
        return { url: result.url, path: filePath };
      } catch (error) {
        console.error('[PuterCloud] File upload failed:', error);
        return null;
      }
    }

    console.log('[PuterCloud] File upload not available (SDK required)');
    return null;
  }

  // Download file from Puter.js cloud storage
  async downloadFile(path: string): Promise<Blob | null> {
    const puter = (window as { puter?: { fs?: { read?: (path: string) => Promise<Blob> } } }).puter;

    if (puter?.fs?.read) {
      try {
        return await puter.fs.read(path);
      } catch (error) {
        console.error('[PuterCloud] File download failed:', error);
        return null;
      }
    }

    return null;
  }
}

export const puterCloudService = new PuterCloudService();
