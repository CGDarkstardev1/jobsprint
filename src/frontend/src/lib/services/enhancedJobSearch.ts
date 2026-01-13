/**
 * Enhanced Job Search Service
 * Integrates with jobPlatformService for real multi-platform search
 * Maintains backward compatibility with existing components
 */

import { storageService } from './storage';
import { jobPlatformService } from './jobPlatforms';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  level: 'entry' | 'mid' | 'senior' | 'principal' | 'executive';
  postedAt: string;
  postedRelative: string;
  description: string;
  requirements: string[];
  tags: string[];
  platform: string;
  platformUrl: string;
  matchScore: number;
  remote: boolean;
}

export interface SearchFilters {
  keywords: string;
  location: string;
  remoteOnly: boolean;
  jobTypes: string[];
  experienceLevel: string;
  salaryMin?: number;
  platforms: string[];
}

export interface SearchResult {
  jobs: Job[];
  total: number;
  platformsSearched: string[];
  searchTime: number;
  query: SearchFilters;
}

export class EnhancedJobSearchService {
  private abortController: AbortController | null = null;
  private lastRequestTime = new Map<string, number>();

  /**
   * Search for jobs across multiple platforms in parallel using platform service
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    // Cancel previous search if running
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const startTime = Date.now();

    // Use the platform service's main search method
    const result = await jobPlatformService.search(filters);

    return result;
  }

  /**
   * Get job details by ID (forwards to platform service)
   */
  async getJobById(id: string): Promise<Job | null> {
    // For now, return null as individual job lookup is not implemented
    // This would require implementing per-platform job detail APIs
    console.warn('getJobById not implemented for enhanced search service');
    return null;
  }

  /**
   * Get trending jobs (forwards to platform service)
   */
  async getTrendingJobs(): Promise<Job[]> {
    // For now, return empty array as trending jobs are not implemented
    console.warn('getTrendingJobs not implemented for enhanced search service');
    return [];
  }

  /**
   * Get similar jobs (forwards to platform service)
   */
  async getSimilarJobs(jobId: string): Promise<Job[]> {
    // For now, return empty array as similar jobs are not implemented
    console.warn('getSimilarJobs not implemented for enhanced search service');
    return [];
  }

  /**
   * Cancel ongoing search
   */
  cancelSearch(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  private async legacySearchPlatform(platform: string, filters: SearchFilters): Promise<Job[]> {
    // For backward compatibility, return sample jobs for platforms not fully implemented
    return [];
  }
}

export const enhancedJobSearchService = new EnhancedJobSearchService();
