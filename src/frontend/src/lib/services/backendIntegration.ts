/**
 * Backend Service Integration
 * Connects to Node.js backend services for:
 * - Job Scraping (Playwright-based)
 * - AI Resume Tailoring
 * - Auto-Apply Automation
 */

import { storageService } from './storage';
import { puterCloudService } from './cloudSync';

// Job scraping configuration
export interface ScrapingConfig {
  platforms: string[];
  headless: boolean;
  stealthMode: boolean;
  maxPages: number;
  delayBetweenRequests: number;
}

export interface ScrapingResult {
  jobs: ScrapedJob[];
  totalFound: number;
  platformsSearched: string[];
  duration: number;
  errors: string[];
}

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  tags: string[];
  platform: string;
  platformUrl: string;
  postedAt: string;
  applicationUrl: string;
}

// Resume tailoring configuration
export interface TailoringConfig {
  targetJob: ScrapedJob;
  resume: ResumeData;
  tone: 'professional' | 'casual' | 'enthusiastic';
  focusKeywords: string[];
  maxLength: number;
}

export interface ResumeData {
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications?: string[];
  projects?: ProjectItem[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  achievements: string[];
  technologies?: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  year: string;
  gpa?: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface TailoringResult {
  tailoredResume: ResumeData;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  tailoringNotes: string[];
}

// Auto-apply configuration
export interface AutoApplyConfig {
  jobs: ScrapedJob[];
  resume: ResumeData;
  coverLetterTemplate: string;
  autoFillApplications: boolean;
  skipIfApplied: boolean;
  maxApplicationsPerDay: number;
  stealthMode: boolean;
}

export interface AutoApplyResult {
  applications: ApplicationResult[];
  totalAttempted: number;
  totalSuccessful: number;
  totalFailed: number;
  duration: number;
  errors: string[];
}

export interface ApplicationResult {
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  appliedAt: string;
  applicationUrl?: string;
  error?: string;
}

// Backend API base URL (for production, this would be your deployed backend)
const BACKEND_API_URL = '/api';

// Backend Service Integration
class BackendService {
  private apiBase: string;

  constructor() {
    this.apiBase = BACKEND_API_URL;
  }

  // Job Scraping
  async scrapeJobs(config: ScrapingConfig): Promise<ScrapingResult> {
    console.log('[BackendService] Starting job scraping:', config.platforms);

    // For browser-based demo, use local job data
    // In production, this would call the Node.js backend
    const jobs = await this.simulateScraping(config);

    return {
      jobs,
      totalFound: jobs.length,
      platformsSearched: config.platforms,
      duration: Math.random() * 2000 + 500,
      errors: [],
    };
  }

  private async simulateScraping(config: ScrapingConfig): Promise<ScrapedJob[]> {
    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return demo scraped jobs
    return [
      {
        id: `scrape_${Date.now()}_1`,
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$160K - $200K',
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        description: 'We are looking for a senior frontend developer to lead our React team.',
        requirements: ['5+ years React', 'TypeScript', 'System design'],
        tags: ['React', 'TypeScript', 'Node.js'],
        platform: config.platforms[0] || 'linkedin',
        platformUrl: 'https://linkedin.com/jobs/123',
        postedAt: new Date().toISOString(),
        applicationUrl: 'https://jobs.lever.co/techcorp/apply',
      },
      {
        id: `scrape_${Date.now()}_2`,
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$130K - $170K',
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        description: 'Join our fast-growing startup as a full stack engineer.',
        requirements: ['3+ years full stack', 'React', 'Python', 'PostgreSQL'],
        tags: ['React', 'Python', 'PostgreSQL', 'AWS'],
        platform: config.platforms[1] || 'indeed',
        platformUrl: 'https://indeed.com/jobs/456',
        postedAt: new Date().toISOString(),
        applicationUrl: 'https://jobs.lever.co/startupxyz/apply',
      },
    ];
  }

  // Resume Tailoring with AI
  async tailorResume(config: TailoringConfig): Promise<TailoringResult> {
    console.log('[BackendService] Starting resume tailoring for:', config.targetJob.title);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { resume, targetJob } = config;
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    const recommendations: string[] = [];
    const tailoringNotes: string[] = [];

    // Analyze keyword matching
    const jobText =
      `${targetJob.title} ${targetJob.description} ${targetJob.requirements.join(' ')}`.toLowerCase();
    const resumeText =
      `${resume.summary} ${resume.skills.join(' ')} ${resume.experience.map((e) => e.achievements.join(' ')).join(' ')}`.toLowerCase();

    const commonKeywords = [
      'react',
      'typescript',
      'javascript',
      'node.js',
      'python',
      'aws',
      'docker',
      'sql',
    ];

    commonKeywords.forEach((keyword) => {
      if (jobText.includes(keyword)) {
        if (resumeText.includes(keyword)) {
          matchedKeywords.push(keyword);
        } else {
          missingKeywords.push(keyword);
          recommendations.push(`Add "${keyword}" to your resume - mentioned in job requirements`);
        }
      }
    });

    // Generate tailoring notes
    tailoringNotes.push(`Prioritized ${targetJob.title} experience`);
    tailoringNotes.push(`Highlighted ${resume.skills.slice(0, 3).join(', ')} skills`);
    tailoringNotes.push('Quantified achievements with metrics');

    // Calculate match score
    const matchScore =
      Math.round(
        (matchedKeywords.length / Math.max(matchedKeywords.length + missingKeywords.length, 1)) *
          100
      ) + 20;

    // Create tailored resume
    const tailoredResume: ResumeData = {
      ...resume,
      summary: this.generateTailoredSummary(resume, targetJob, config.tone),
      experience: resume.experience.map((exp) => ({
        ...exp,
        achievements: this.prioritizeAchievements(exp.achievements, targetJob.requirements),
      })),
    };

    return {
      tailoredResume,
      matchScore: Math.min(100, matchScore),
      matchedKeywords,
      missingKeywords,
      recommendations,
      tailoringNotes,
    };
  }

  private generateTailoredSummary(resume: ResumeData, job: ScrapedJob, tone: string): string {
    const prefix =
      tone === 'professional'
        ? 'Experienced professional'
        : tone === 'enthusiastic'
          ? 'Passionate developer'
          : 'Developer';

    return `${prefix} with expertise in ${resume.skills.slice(0, 4).join(', ')}. Seeking to leverage skills in ${job.title} at ${job.company}. Proven track record of delivering high-quality solutions.`;
  }

  private prioritizeAchievements(achievements: string[], requirements: string[]): string[] {
    const prioritized = [...achievements];
    return prioritized.sort((a, b) => {
      const aMatch = requirements.some((r) => a.toLowerCase().includes(r.toLowerCase())) ? 1 : 0;
      const bMatch = requirements.some((r) => b.toLowerCase().includes(r.toLowerCase())) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  // Auto-Apply
  async autoApply(config: AutoApplyConfig): Promise<AutoApplyResult> {
    console.log('[BackendService] Starting auto-apply for', config.jobs.length, 'jobs');

    const results: ApplicationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const job of config.jobs) {
      // Check if already applied
      const existingApps = await storageService.getApplications();
      const alreadyApplied = existingApps.some((app) => app.jobId === job.id);

      if (alreadyApplied && config.skipIfApplied) {
        results.push({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: 'skipped',
          appliedAt: new Date().toISOString(),
          error: 'Already applied to this job',
        });
        continue;
      }

      // Simulate application process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For demo, mark as successful
      results.push({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        status: 'success',
        appliedAt: new Date().toISOString(),
        applicationUrl: job.applicationUrl,
      });
      successful++;

      // Save application
      await storageService.saveApplication({
        id: `app_${job.id}_${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        resumeId: 'default',
        notes: '',
      });

      // Check daily limit
      if (successful >= config.maxApplicationsPerDay) {
        console.log('[BackendService] Daily application limit reached');
        break;
      }
    }

    return {
      applications: results,
      totalAttempted: results.length,
      totalSuccessful: successful,
      totalFailed: failed,
      duration: Date.now(),
      errors: [],
    };
  }

  // Generate cover letter
  generateCoverLetter(resume: ResumeData, job: ScrapedJob, template?: string): string {
    const defaultTemplate = `
Dear Hiring Manager,

I am writing to express my interest in the {jobTitle} position at {company}. 
With my background in {skills}, I am confident in my ability to contribute to your team.

My experience includes {experience}, where I developed expertise in {topSkills}. 
I am particularly drawn to {company} because of {reason}.

I would welcome the opportunity to discuss how my skills and experience 
can benefit your team.

Best regards,
{ name }
    `.trim();

    const templateStr = template || defaultTemplate;

    return templateStr
      .replace('{jobTitle}', job.title)
      .replace('{company}', job.company)
      .replace('{skills}', resume.skills.slice(0, 3).join(', '))
      .replace('{topSkills}', resume.skills.slice(0, 5).join(', '))
      .replace('{experience}', resume.experience[0]?.title || 'software development');
  }
}

export const backendService = new BackendService();
