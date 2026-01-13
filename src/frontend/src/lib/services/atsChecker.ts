/**
 * ATS Checker Service - Analyze resume-job compatibility
 * Provides match scores, keyword analysis, and recommendations
 */

export interface ATSResult {
  overallScore: number;
  keywordScore: number;
  structureScore: number;
  keywordMatch: {
    found: string[];
    missing: string[];
  };
  recommendations: string[];
  formattingScore: number;
  experienceMatch: number;
}

export interface ResumeData {
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export interface JobData {
  title: string;
  description: string;
  requirements: string[];
  preferredSkills?: string[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  year: string;
}

// Common tech keywords to check
const TECH_KEYWORDS = [
  // Frontend
  'react',
  'typescript',
  'javascript',
  'css',
  'html',
  'sass',
  'less',
  'webpack',
  'vite',
  'next.js',
  'gatsby',
  'redux',
  'mobx',
  'zustand',
  // Backend
  'node.js',
  'python',
  'java',
  'go',
  'rust',
  'ruby',
  'php',
  'express',
  'fastify',
  'nestjs',
  'django',
  'flask',
  'spring',
  // Database
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'elasticsearch',
  'sql',
  'nosql',
  'prisma',
  'sequelize',
  'typeorm',
  // Cloud & DevOps
  'aws',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'terraform',
  'ci/cd',
  'jenkins',
  'github actions',
  'circleci',
  // Other
  'graphql',
  'rest api',
  'microservices',
  'agile',
  'scrum',
  'testing',
  'jest',
  'cypress',
  'playwright',
  'mocha',
  'performance',
  'security',
  'oauth',
  'jwt',
];

class ATSCheckerService {
  /**
   * Analyze resume-job compatibility
   */
  analyze(resume: ResumeData, job: JobData): ATSResult {
    const jobText =
      `${job.title} ${job.description} ${job.requirements.join(' ')} ${(job.preferredSkills || []).join(' ')}`.toLowerCase();
    const resumeText = this.extractResumeText(resume);

    // Keyword Analysis
    const { found, missing } = this.analyzeKeywords(jobText, resumeText);

    // Calculate scores
    const keywordScore = this.calculateKeywordScore(found.length, found.length + missing.length);
    const structureScore = this.analyzeStructure(resume);
    const formattingScore = this.analyzeFormatting(resume);
    const experienceMatch = this.analyzeExperience(resume, job);

    const overallScore = Math.round(
      keywordScore * 0.4 + structureScore * 0.25 + formattingScore * 0.15 + experienceMatch * 0.2
    );

    const recommendations = this.generateRecommendations(
      missing,
      overallScore,
      structureScore,
      formattingScore
    );

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      keywordScore,
      structureScore,
      keywordMatch: { found, missing: missing.slice(0, 10) },
      recommendations,
      formattingScore,
      experienceMatch,
    };
  }

  /**
   * Extract all text from resume
   */
  private extractResumeText(resume: ResumeData): string {
    const parts: string[] = [];

    if (resume.summary) parts.push(resume.summary);
    parts.push(...resume.skills);

    resume.experience.forEach((exp) => {
      parts.push(exp.title, exp.company, exp.description);
    });

    resume.education.forEach((edu) => {
      parts.push(edu.degree, edu.school);
    });

    return parts.join(' ').toLowerCase();
  }

  /**
   * Analyze keyword matching
   */
  private analyzeKeywords(
    jobText: string,
    resumeText: string
  ): { found: string[]; missing: string[] } {
    const found: string[] = [];
    const missing: string[] = [];

    TECH_KEYWORDS.forEach((keyword) => {
      if (jobText.includes(keyword)) {
        if (resumeText.includes(keyword)) {
          found.push(keyword);
        } else {
          missing.push(keyword);
        }
      }
    });

    return { found, missing };
  }

  /**
   * Calculate keyword score (0-100)
   */
  private calculateKeywordScore(found: number, total: number): number {
    if (total === 0) return 70; // No required keywords found
    const ratio = found / total;
    return Math.round(50 + ratio * 50); // 50-100 range
  }

  /**
   * Analyze resume structure
   */
  private analyzeStructure(resume: ResumeData): number {
    let score = 0;
    const maxScore = 100;

    // Summary check (20 points)
    if (resume.summary && resume.summary.length >= 50) score += 20;
    else if (resume.summary) score += 10;

    // Skills check (25 points)
    if (resume.skills && resume.skills.length >= 5) score += 25;
    else if (resume.skills && resume.skills.length > 0) score += 15;

    // Experience check (30 points)
    if (resume.experience && resume.experience.length >= 2) score += 30;
    else if (resume.experience && resume.experience.length >= 1) score += 20;

    // Education check (25 points)
    if (resume.education && resume.education.length >= 1) score += 25;

    return score;
  }

  /**
   * Analyze formatting quality
   */
  private analyzeFormatting(resume: ResumeData): number {
    let score = 100;

    // Check for very short descriptions
    resume.experience.forEach((exp) => {
      if (exp.description.length < 50) score -= 10;
    });

    // Check for duplicate skills
    const uniqueSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
    if (uniqueSkills.size < resume.skills.length * 0.8) score -= 15;

    return Math.max(0, score);
  }

  /**
   * Analyze experience relevance
   */
  private analyzeExperience(resume: ResumeData, job: JobData): number {
    const jobKeywords = [...job.requirements, ...(job.preferredSkills || [])]
      .join(' ')
      .toLowerCase();

    let totalScore = 0;
    let maxScore = resume.experience.length * 25;

    resume.experience.forEach((exp) => {
      const expText = `${exp.title} ${exp.company} ${exp.description}`.toLowerCase();
      let expScore = 0;

      // Check title relevance
      if (exp.title.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])) {
        expScore += 10;
      }

      // Check description relevance
      const matchingKeywords = jobKeywords
        .split(' ')
        .filter((kw) => kw.length > 3 && expText.includes(kw)).length;

      expScore += Math.min(15, matchingKeywords * 3);
      totalScore += Math.min(25, expScore);
    });

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 50;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    missing: string[],
    overallScore: number,
    structureScore: number,
    formattingScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('Your resume needs significant tailoring for this role.');
    }

    if (missing.length > 0) {
      const topMissing = missing
        .slice(0, 5)
        .map((m) => `"${m}"`)
        .join(', ');
      recommendations.push(`Add missing keywords: ${topMissing}`);
    }

    if (structureScore < 70) {
      recommendations.push(
        'Strengthen your resume structure with a clear summary and detailed experience.'
      );
    }

    if (formattingScore < 80) {
      recommendations.push(
        'Expand your job descriptions to highlight achievements and responsibilities.'
      );
    }

    if (overallScore >= 90) {
      recommendations.push('Great match! Your resume is well-tailored for this position.');
    } else if (overallScore >= 75) {
      recommendations.push('Good match with minor improvements needed.');
    }

    return recommendations;
  }
}

export const atsCheckerService = new ATSCheckerService();
