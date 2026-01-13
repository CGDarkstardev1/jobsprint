/**
 * Storage Service - Browser-compatible localStorage/IndexedDB storage
 * Handles persistence for user settings, resumes, and applications
 */

const STORAGE_KEYS = {
  SETTINGS: 'jobsprint_settings',
  RESUMES: 'jobsprint_resumes',
  APPLICATIONS: 'jobsprint_applications',
  USER_PROFILE: 'jobsprint_user_profile',
  SAVED_JOBS: 'jobsprint_saved_jobs',
  SEARCH_HISTORY: 'jobsprint_search_history',
} as const;

export interface UserSettings {
  searchKeywords: string;
  location: string;
  remoteOnly: boolean;
  jobTypes: string[];
  experienceLevel: string;
  notifications: boolean;
  autoSave: boolean;
}

export interface Resume {
  id: string;
  name: string;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeContent {
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  degree: string;
  school: string;
  year: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'applied' | 'interviewing' | 'rejected' | 'offered';
  appliedAt: string;
  resumeId: string;
  notes: string;
}

export interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedAt: string;
  savedAt: string;
  matchScore: number;
}

class StorageService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize IndexedDB for larger data
    await this.initIndexedDB();
    this.initialized = true;
    console.log('[StorageService] Initialized');
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Create object stores
        const db = request.result;
        if (!db.objectStoreNames.contains('applications')) {
          db.createObjectStore('applications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('resumes')) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        }
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('applications')) {
          db.createObjectStore('applications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('resumes')) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        }
      };
    });
  }

  // Settings
  getSettings(): UserSettings {
    const defaults: UserSettings = {
      searchKeywords: 'software engineer',
      location: 'remote',
      remoteOnly: true,
      jobTypes: ['full-time'],
      experienceLevel: 'any',
      notifications: true,
      autoSave: true,
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  }

  saveSettings(settings: Partial<UserSettings>): void {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  }

  // User Profile
  getUserProfile(): Record<string, unknown> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveUserProfile(profile: Record<string, unknown>): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  // Resumes (IndexedDB)
  async getResumes(): Promise<Resume[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['resumes'], 'readonly');
        const store = transaction.objectStore('resumes');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => reject(getAll.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveResume(resume: Resume): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['resumes'], 'readwrite');
        const store = transaction.objectStore('resumes');
        const put = store.put(resume);
        put.onsuccess = () => resolve();
        put.onerror = () => reject(put.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteResume(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['resumes'], 'readwrite');
        const store = transaction.objectStore('resumes');
        const del = store.delete(id);
        del.onsuccess = () => resolve();
        del.onerror = () => reject(del.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Applications (IndexedDB)
  async getApplications(): Promise<Application[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['applications'], 'readonly');
        const store = transaction.objectStore('applications');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => reject(getAll.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveApplication(application: Application): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['applications'], 'readwrite');
        const store = transaction.objectStore('applications');
        const put = store.put(application);
        put.onsuccess = () => resolve();
        put.onerror = () => reject(put.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteApplication(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JobSprintDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['applications'], 'readwrite');
        const store = transaction.objectStore('applications');
        const del = store.delete(id);
        del.onsuccess = () => resolve();
        del.onerror = () => reject(del.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Saved Jobs (localStorage for simplicity)
  getSavedJobs(): SavedJob[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveJob(job: SavedJob): void {
    const jobs = this.getSavedJobs();
    const exists = jobs.find((j) => j.jobId === job.jobId);
    if (!exists) {
      jobs.unshift(job);
      localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(jobs.slice(0, 100)));
    }
  }

  removeJob(jobId: string): void {
    const jobs = this.getSavedJobs().filter((j) => j.jobId !== jobId);
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(jobs));
  }

  // Search History
  getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addSearchHistory(query: string): void {
    const history = this.getSearchHistory();
    const filtered = history.filter((h) => h !== query);
    filtered.unshift(query);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(filtered.slice(0, 20)));
  }

  clearSearchHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  }

  // Stats
  async getStats(): Promise<{
    totalApplications: number;
    interviews: number;
    responseRate: number;
    pending: number;
  }> {
    const apps = await this.getApplications();
    const pending = apps.filter((a) => a.status === 'pending').length;
    const applied = apps.filter(
      (a) => a.status === 'applied' || a.status === 'interviewing' || a.status === 'offered'
    ).length;
    const interviews = apps.filter(
      (a) => a.status === 'interviewing' || a.status === 'offered'
    ).length;
    const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

    return {
      totalApplications: apps.length,
      interviews,
      responseRate,
      pending,
    };
  }
}

export const storageService = new StorageService();
