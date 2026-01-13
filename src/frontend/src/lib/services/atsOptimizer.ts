/**
 * ATS Optimization Service
 * Implements keyword extraction, resume analysis, and match scoring
 */

import { Job as JobType } from './jobSearch';
import { storageService } from './storage';

// Define missing types
export interface ResumeData {
  id: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

export interface JobData {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
}

// Declare Puter.js globals based on official SDK research
declare global {
  interface PuterFSItem {
    name: string;
    path: string;
    uid: string;
    is_dir: boolean;
    size: number;
    created: number;
    modified: number;
  }

  const puter: {
    fs: {
      write: (
        path: string,
        data: string | Blob,
        options?: { overwrite?: boolean }
      ) => Promise<PuterFSItem>;
      readdir: (path: string) => Promise<PuterFSItem[]>;
      read: (path: string) => Promise<Blob>;
    };
    ai: {
      chat: (
        prompt: string,
        imageURL?: string,
        options?: { model?: string; max_tokens?: number }
      ) => Promise<{
        message?: {
          content: string;
        };
      }>;
    };
  };
}

export interface ATSResult {
  score: number;
  missingKeywords: string[];
  keywordDensity: number;
  recommendations: string[];
  timestamp?: string;
  issues: {
    grammar: string[];
    formatting: string[];
    structure: string[];
  };
}

export class ATSOptimizerService {
  /**
   * Extract keywords from job description
   */
  private extractKeywords(description: string): string[] {
    const commonWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'of',
      'with',
      'for',
      'by',
      'a',
      'an',
      'as',
      'are',
      'is',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'should',
      'could',
      'may',
      'might',
      'can',
      'shall',
      'must',
      'should',
      'team',
      'skills',
      'skill',
      'experience',
      'work',
      'project',
      'product',
      'service',
      'process',
      'system',
      'design',
      'develop',
      'implement',
      'create',
      'build',
      'test',
      'run',
      'use',
      'data',
      'database',
      'application',
      'software',
      'tool',
      'method',
      'approach',
      'algorithm',
      'code',
      'performance',
      'security',
      'user',
      'client',
      'server',
      'interface',
      'system',
      'component',
      'management',
      'business',
      'technical',
      'functional',
      'non',
      'functional',
      'requirements',
      'specification',
    ]);

    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word));

    return [...new Set(words)];
  }

  /**
   * Analyze resume against job description
   */
  private analyzeMatch(resume: ResumeData, job: JobData): ATSResult {
    const resumeText =
      `${resume.summary} ${resume.skills.join(' ')} ${resume.experience.map((exp) => `${exp.title} at ${exp.company}`).join(' ')}`.toLowerCase();
    const jobText = `${job.title} at ${job.company} ${job.description}`.toLowerCase();

    const resumeWords = this.extractKeywords(resumeText);
    const jobWords = this.extractKeywords(job.description);

    const matchingKeywords = resumeWords.filter((word) => jobWords.includes(word));
    const missingKeywords = jobWords.filter((word) => !resumeWords.includes(word));

    const keywordDensity = (matchingKeywords.length / jobWords.length) * 100;
    const missingCount = missingKeywords.length;

    let score = Math.round(keywordDensity * 100);

    // Bonus points for relevant sections
    if (
      resumeText.includes(job.title.toLowerCase()) &&
      resumeText.includes(job.company.toLowerCase())
    ) {
      score += 10; // Title and company match
    }

    if (matchingKeywords.length >= 5) score += 15; // Strong keyword match
    if (matchingKeywords.length >= 8) score += 10; // Good keyword match

    // Normalize score to 0-100
    score = Math.min(Math.max(score, 0), 100);

    const recommendations: string[] = [];
    if (missingCount > 0) {
      recommendations.push(
        `Add these missing keywords to your resume: ${missingKeywords.slice(0, 5).join(', ')}${missingCount > 5 ? '...' : ''}`
      );
    }

    if (keywordDensity < 30) {
      recommendations.push(
        'Consider adding more relevant keywords from the job description to your resume'
      );
    }

    const issues: {
      grammar: string[];
      formatting: string[];
      structure: string[];
    } = {
      grammar: [],
      formatting: [],
      structure: [],
    };

    // Check for common ATS issues
    if (resume.summary.length < 50) {
      issues.structure.push('Consider a more detailed professional summary');
    }

    if (resumeText.length > 1000) {
      issues.structure.push('Resume may be too long for some ATS systems');
    }

    return {
      score,
      missingKeywords,
      keywordDensity,
      recommendations,
      issues,
    };
  }

  /**
   * Generate optimized resume content
   */
  private generateOptimizedResume(original: ResumeData, job: JobData): ResumeData {
    const updated = { ...original };

    // Add missing keywords naturally to experience descriptions
    if (job.requirements && job.requirements.length > 0) {
      const newSkills = [...original.skills];
      const newExperience = [...original.experience];

      // Find which requirements are missing
      const resumeText =
        `${original.summary} ${original.skills.join(' ')} ${original.experience.map((exp) => `${exp.title} at ${exp.company}`).join(' ')}`.toLowerCase();
      const missingKeywords = job.requirements.filter(
        (req) => !resumeText.toLowerCase().includes(req.toLowerCase())
      );

      // Add missing requirements to skills and experience
      if (missingKeywords.length > 0) {
        newSkills.push(`Resume Optimization: Added ${missingKeywords.slice(0, 3).join(', ')}`);

        const randomIndex = Math.floor(Math.random() * newExperience.length);
        newExperience.splice(randomIndex, 0, {
          title: 'Optimized Experience',
          company: 'Resume Optimization',
          duration: 'Recent',
          description: `Enhanced with keywords: ${missingKeywords.slice(0, 3).join(', ')} to match ${job.title}`,
        });
      }

      updated.skills = newSkills;
      updated.experience = newExperience;
    }

    return updated;
  }

  /**
   * Get ATS score for a resume-job pair
   */
  async analyzeResume(resume: ResumeData, job: JobData): Promise<ATSResult> {
    const result = this.analyzeMatch(resume, job);

    // Store analysis for learning
    await this.saveATSAnalysis(resume.id, job.id, result);

    return result;
  }

  /**
   * Save ATS analysis for learning
   */
  private async saveATSAnalysis(resumeId: string, jobId: string, result: ATSResult): Promise<void> {
    try {
      const filename = `ats_analysis_${resumeId}_${jobId}.json`;
      await puter.fs.write(filename, JSON.stringify(result, null, 2));
      console.log(`ATS analysis saved: ${filename}`);
    } catch (error) {
      console.error('Failed to save ATS analysis:', error);
      throw error;
    }
  }

  /**
   * Get ATS analysis history
   */
  async getATSAnalysisHistory(): Promise<ATSResult[]> {
    try {
      const files = await puter.fs.readdir('/');
      const analyses = [];

      for (const file of files) {
        if (file.name.startsWith('ats_analysis_') && file.name.endsWith('.json')) {
          const blob = await puter.fs.read(file.name);
          const content = await blob.text();
          const analysis = JSON.parse(content);
          analyses.push(analysis);
        }
      }

      return analyses.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to load ATS analysis history:', error);
      throw error;
    }
  }

  /**
   * Tailor resume for specific job
   */
  async tailorResume(resumeId: string, job: JobData): Promise<ResumeData> {
    const resumes = await storageService.getResumes();
    const originalResume = resumes.find((r) => r.id === resumeId);

    if (!originalResume) {
      throw new Error('Resume not found');
    }

    const resumeData: ResumeData = {
      id: originalResume.id,
      summary: originalResume.content.summary,
      skills: originalResume.content.skills,
      experience: originalResume.content.experience.map((exp) => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        description: exp.description,
      })),
    };

    const optimized = this.generateOptimizedResume(resumeData, job);

    await storageService.saveResume({
      ...originalResume,
      content: {
        ...originalResume.content,
        summary: optimized.summary,
        skills: optimized.skills,
        experience: optimized.experience,
      },
      updatedAt: new Date().toISOString(),
    });

    console.log(`Resume ${resumeId} tailored for job: ${job.title} at ${job.company}`);

    return optimized;
  }
}

export const atsOptimizerService = new ATSOptimizerService();
