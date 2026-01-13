/**
 * Job Search Service - Realistic job search with multiple platform support
 * Simulates multi-threaded search across LinkedIn, Indeed, Glassdoor, etc.
 */

import { storageService } from './storage';

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

// Realistic job database
const JOB_DATABASE: Job[] = [
  {
    id: 'li-001',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$160K - $200K',
    salaryMin: 160000,
    salaryMax: 200000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T10:00:00Z',
    postedRelative: '2 days ago',
    description:
      'We are looking for a Senior Frontend Engineer to join our payments platform team. You will work on building beautiful, performant interfaces for millions of businesses worldwide.',
    requirements: [
      '5+ years React experience',
      'TypeScript mastery',
      'Performance optimization',
      'Test-driven development',
    ],
    tags: ['React', 'TypeScript', 'GraphQL', 'CSS'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/view/123456',
    matchScore: 94,
    remote: true,
  },
  {
    id: 'indeed-001',
    title: 'Full Stack Developer',
    company: 'Remote-first Startup',
    location: 'Remote',
    salary: '$120K - $160K',
    salaryMin: 120000,
    salaryMax: 160000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-12T14:00:00Z',
    postedRelative: '1 day ago',
    description:
      'Join our fast-growing team building the future of remote work. We need a full stack developer to help us scale our platform.',
    requirements: ['3+ years full stack', 'React & Node.js', 'PostgreSQL', 'AWS experience'],
    tags: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/789012',
    matchScore: 88,
    remote: true,
  },
  {
    id: 'gd-001',
    title: 'UI Engineer',
    company: 'Figma',
    location: 'New York, NY',
    salary: '$140K - $180K',
    salaryMin: 140000,
    salaryMax: 180000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-10T09:00:00Z',
    postedRelative: '3 days ago',
    description:
      'Help us build the best design tools in the world. We are looking for a UI engineer who cares about every pixel and interaction.',
    requirements: ['Strong CSS/Sass', 'Design systems', 'TypeScript', 'Performance'],
    tags: ['React', 'TypeScript', 'CSS', 'Design Systems'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/345678',
    matchScore: 82,
    remote: false,
  },
  {
    id: 'ro-001',
    title: 'Senior React Developer',
    company: 'Shopify',
    location: 'Remote',
    salary: '$150K - $190K',
    salaryMin: 150000,
    salaryMax: 190000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T08:00:00Z',
    postedRelative: '5 hours ago',
    description:
      "Join Shopify's platform team and help millions of entrepreneurs succeed. Remote-first culture with great benefits.",
    requirements: [
      '5+ years React',
      'Redux or similar',
      'Testing (Jest/Cypress)',
      'CI/CD pipelines',
    ],
    tags: ['React', 'Redux', 'Jest', 'GraphQL'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/901234',
    matchScore: 96,
    remote: true,
  },
  {
    id: 'wf-001',
    title: 'Frontend Architect',
    company: 'Airbnb',
    location: 'Seattle, WA',
    salary: '$180K - $220K',
    salaryMin: 180000,
    salaryMax: 220000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-09T16:00:00Z',
    postedRelative: '4 days ago',
    description:
      'Lead the architecture of our guest and host facing web applications. Work on challenging problems at scale.',
    requirements: ['8+ years experience', 'System design', 'Mentoring', 'React ecosystem'],
    tags: ['React', 'System Design', 'Leadership', 'Performance'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/567890',
    matchScore: 75,
    remote: false,
  },
  {
    id: 'otta-001',
    title: 'Software Engineer II',
    company: 'Netflix',
    location: 'Los Gatos, CA',
    salary: '$170K - $210K',
    salaryMin: 170000,
    salaryMax: 210000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T11:00:00Z',
    postedRelative: '1 day ago',
    description:
      "Work on Netflix's member-facing applications used by 200+ million people worldwide. Freedom and responsibility.",
    requirements: [
      '4+ years experience',
      'JavaScript/TypeScript',
      'A/B testing',
      'Performance at scale',
    ],
    tags: ['React', 'TypeScript', 'A/B Testing', 'Performance'],
    platform: 'otta',
    platformUrl: 'https://otta.com/jobs/234567',
    matchScore: 91,
    remote: false,
  },
  {
    id: 'li-002',
    title: 'Mid-level React Developer',
    company: 'Spotify',
    location: 'Remote',
    salary: '$100K - $130K',
    salaryMin: 100000,
    salaryMax: 130000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-13T06:00:00Z',
    postedRelative: '7 hours ago',
    description:
      'Join our music streaming team and help create the best listening experience. Remote-first with flexible hours.',
    requirements: ['2+ years React', 'CSS/Sass', 'Testing', 'Agile development'],
    tags: ['React', 'CSS', 'Jest', 'Agile'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/678901',
    matchScore: 89,
    remote: true,
  },
  {
    id: 'indeed-002',
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: '$200K - $250K',
    salaryMin: 200000,
    salaryMax: 250000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T13:00:00Z',
    postedRelative: '2 days ago',
    description:
      'Work on products used by billions. Solve challenging problems at scale with talented colleagues.',
    requirements: [
      '5+ years experience',
      'JavaScript/TypeScript',
      'System design',
      'Production experience',
    ],
    tags: ['React', 'TypeScript', 'System Design', 'Cloud'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/456789',
    matchScore: 85,
    remote: false,
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class JobSearchService {
  private abortController: AbortController | null = null;

  /**
   * Search for jobs across multiple platforms in parallel
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    // Cancel previous search if running
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const startTime = Date.now();
    const platformsSearched: string[] = [];

    // Simulate parallel platform searches
    const searchPromises =
      filters.platforms.length > 0
        ? filters.platforms.map((p) => this.searchPlatform(p, filters))
        : ['linkedin', 'indeed', 'glassdoor', 'remoteok', 'wellfound', 'otta'].map((p) =>
            this.searchPlatform(p, filters)
          );

    const results = await Promise.allSettled(searchPromises);

    // Aggregate results
    let allJobs: Job[] = [];
    results.forEach((result, index) => {
      const platform =
        filters.platforms[index] ||
        ['linkedin', 'indeed', 'glassdoor', 'remoteok', 'wellfound', 'otta'][index];
      if (result.status === 'fulfilled' && result.value) {
        allJobs = allJobs.concat(result.value);
        platformsSearched.push(platform);
      }
    });

    // Deduplicate by job ID
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });

    // Sort by match score
    uniqueJobs.sort((a, b) => b.matchScore - a.matchScore);

    return {
      jobs: uniqueJobs,
      total: uniqueJobs.length,
      platformsSearched,
      searchTime: Date.now() - startTime,
      query: filters,
    };
  }

  /**
   * Search a specific platform
   */
  private async searchPlatform(platform: string, filters: SearchFilters): Promise<Job[]> {
    await delay(100 + Math.random() * 200); // Simulate network latency

    return JOB_DATABASE.filter((job) => {
      // Platform filter
      if (job.platform !== platform) return false;

      // Remote filter
      if (filters.remoteOnly && !job.remote) return false;

      // Job type filter
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.type)) return false;

      // Experience level filter
      if (filters.experienceLevel !== 'any') {
        const levelMap: Record<string, string[]> = {
          entry: ['entry'],
          mid: ['mid', 'senior'],
          senior: ['senior', 'principal'],
          executive: ['principal', 'executive'],
        };
        const allowedLevels = levelMap[filters.experienceLevel] || [];
        if (!allowedLevels.includes(job.level)) return false;
      }

      // Salary filter
      if (filters.salaryMin && job.salaryMax < filters.salaryMin) return false;

      // Keyword search
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase().split(' ');
        const searchText =
          `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
        const hasKeyword = keywords.some((kw) => searchText.includes(kw));
        if (!hasKeyword) return false;
      }

      // Location search
      if (filters.location && filters.location !== 'remote') {
        const locationMatch = job.location.toLowerCase().includes(filters.location.toLowerCase());
        if (!locationMatch) return false;
      }

      return true;
    });
  }

  /**
   * Get job details by ID
   */
  async getJobById(id: string): Promise<Job | null> {
    await delay(50);
    return JOB_DATABASE.find((job) => job.id === id) || null;
  }

  /**
   * Get trending jobs
   */
  async getTrendingJobs(): Promise<Job[]> {
    await delay(100);
    return JOB_DATABASE.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
  }

  /**
   * Get similar jobs
   */
  async getSimilarJobs(jobId: string): Promise<Job[]> {
    await delay(50);
    const job = JOB_DATABASE.find((j) => j.id === jobId);
    if (!job) return [];

    return JOB_DATABASE.filter(
      (j) => j.id !== jobId && j.tags.some((t) => job.tags.includes(t))
    ).slice(0, 4);
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
}

export const jobSearchService = new JobSearchService();
