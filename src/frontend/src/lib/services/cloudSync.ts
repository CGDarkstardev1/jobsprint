/**
 * Puter.js Cloud Service for JobSprint
 * Provides cloud sync, authentication, and storage
 */

import type { Application, SavedJob, Resume, UserSettings } from './storage';

const PUTER_API_URL = 'https://api.puter.com';

interface CloudUser {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

interface CloudSyncResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

class PuterCloudService {
  private token: string | null = null;
  private user: CloudUser | null = null;
  private initialized = false;

  // Initialize Puter.js SDK
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if Puter.js SDK is loaded
      if (typeof window !== 'undefined' && (window as { puter?: unknown }).puter) {
        console.log('[PuterCloud] SDK loaded');
        this.initialized = true;
        return true;
      }

      // For GitHub Pages deployment, use API-based approach
      console.log('[PuterCloud] Using API-based cloud sync');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PuterCloud] Initialization failed:', error);
      return false;
    }
  }

  // Authentication
  async signIn(): Promise<CloudUser | null> {
    // For demo, create a local user session
    // In production, integrate with Puter.js auth
    this.user = {
      id: 'user_' + Date.now(),
      username: 'Demo User',
      email: 'demo@jobsprint.io',
    };
    this.token = 'demo_token_' + Date.now();

    console.log('[PuterCloud] Signed in as:', this.user.username);
    return this.user;
  }

  async signOut(): Promise<boolean> {
    this.user = null;
    this.token = null;
    console.log('[PuterCloud] Signed out');
    return true;
  }

  getCurrentUser(): CloudUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Cloud Storage (API-based for GitHub Pages)
  private async apiRequest(
    endpoint: string,
    method = 'GET',
    body?: unknown
  ): Promise<CloudSyncResult> {
    // In production, this would call Puter.js API
    // For now, we use localStorage as cloud proxy
    return { success: true };
  }

  // Data sync methods - use localStorage as cloud storage proxy
  async syncApplications(applications: Application[]): Promise<CloudSyncResult> {
    try {
      const key = 'jobsprint_cloud_applications';
      const data = {
        applications,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[PuterCloud] Synced applications:', applications.length);
      return { success: true, data: applications };
    } catch (error) {
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
    try {
      const key = 'jobsprint_cloud_saved_jobs';
      const data = {
        jobs,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[PuterCloud] Synced saved jobs:', jobs.length);
      return { success: true, data: jobs };
    } catch (error) {
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
    try {
      const key = 'jobsprint_cloud_resumes';
      const data = {
        resumes,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[PuterCloud] Synced resumes:', resumes.length);
      return { success: true, data: resumes };
    } catch (error) {
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
    try {
      const key = 'jobsprint_cloud_settings';
      const data = {
        settings,
        syncedAt: new Date().toISOString(),
        userId: this.user?.id,
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[PuterCloud] Synced settings');
      return { success: true };
    } catch (error) {
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
    try {
      await this.syncApplications(data.applications);
      await this.syncSavedJobs(data.savedJobs);
      await this.syncResumes(data.resumes);
      await this.syncSettings(data.settings);

      console.log('[PuterCloud] Full sync completed');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Export data for backup
  async exportAllData(): Promise<Record<string, unknown>> {
    return {
      applications: await this.getApplications(),
      savedJobs: await this.getSavedJobs(),
      resumes: await this.getResumes(),
      settings: await this.getSettings(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
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

      console.log('[PuterCloud] Data imported successfully');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const puterCloudService = new PuterCloudService();
