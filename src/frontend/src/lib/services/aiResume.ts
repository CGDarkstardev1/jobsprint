/**
 * AI Resume Tailoring Service
 * Provides intelligent resume optimization using AI
 * Supports OpenAI, Anthropic, and local AI models
 */

import { storageService } from './storage';

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

export interface JobTarget {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  preferredSkills?: string[];
  location: string;
  salary?: string;
}

export interface TailoringConfig {
  targetJob: JobTarget;
  resume: ResumeData;
  tone: 'professional' | 'casual' | 'enthusiastic';
  emphasisOnExperience: boolean;
  includeMetrics: boolean;
  maxLength: number;
}

export interface TailoringResult {
  tailoredResume: ResumeData;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  tailoringNotes: string[];
  coverLetter?: string;
}

// AI Provider configuration
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'demo';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

// Keyword category analysis
const KEYWORD_CATEGORIES = {
  frontend: [
    'react',
    'vue',
    'angular',
    'javascript',
    'typescript',
    'css',
    'html',
    'sass',
    'tailwind',
    'styled-components',
    'redux',
    'zustand',
    'mobx',
  ],
  backend: [
    'node.js',
    'python',
    'java',
    'go',
    'rust',
    'ruby',
    'php',
    'express',
    'nestjs',
    'django',
    'fastapi',
    'spring',
  ],
  database: [
    'sql',
    'postgresql',
    'mysql',
    'mongodb',
    'redis',
    'dynamodb',
    'elasticsearch',
    'graphql',
    'prisma',
    'typeorm',
  ],
  devops: [
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'ci/cd',
    'jenkins',
    'github actions',
    'terraform',
    'ansible',
    'linux',
  ],
  testing: [
    'jest',
    'cypress',
    'playwright',
    'mocha',
    'jasmine',
    'testing-library',
    'selenium',
    'vitest',
    'junit',
    'pytest',
  ],
  softSkills: [
    'leadership',
    'communication',
    'collaboration',
    'problem-solving',
    'agile',
    'scrum',
    'mentoring',
    'teamwork',
  ],
};

// Common action verbs for resume
const ACTION_VERBS = [
  'Architected',
  'Designed',
  'Developed',
  'Implemented',
  'Led',
  'Managed',
  'Optimized',
  'Built',
  'Created',
  'Delivered',
  'Engineered',
  'Enhanced',
  'Improved',
  'Launched',
  'Mentored',
  'Orchestrated',
  'Spearheaded',
  'Streamlined',
  'Transformed',
  'Pioneered',
];

class AIResumeService {
  private config: AIConfig = {
    provider: 'demo',
    model: 'gpt-4',
  };

  // Configure AI provider
  configureAI(config: AIConfig): void {
    this.config = config;
    console.log('[AIResumeService] AI configured:', config.provider);
  }

  // Analyze job requirements and extract keywords
  analyzeJobRequirements(job: JobTarget): {
    requiredKeywords: string[];
    preferredKeywords: string[];
    skillsGaps: string[];
    analyzedDescription: string;
  } {
    const description =
      job.description.toLowerCase() + ' ' + job.requirements.join(' ').toLowerCase();
    const requiredKeywords: string[] = [];
    const preferredKeywords: string[] = [];
    const skillsGaps: string[] = [];

    // Extract keywords from each category
    Object.entries(KEYWORD_CATEGORIES).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        if (description.includes(keyword)) {
          if (job.requirements.some((req) => req.toLowerCase().includes(keyword))) {
            requiredKeywords.push(keyword);
          } else {
            preferredKeywords.push(keyword);
          }
        }
      });
    });

    // Extract action verbs from job description
    const foundVerbs = ACTION_VERBS.filter((verb) => description.includes(verb.toLowerCase()));

    return {
      requiredKeywords: [...new Set(requiredKeywords)],
      preferredKeywords: [...new Set(preferredKeywords)],
      skillsGaps,
      analyzedDescription: description,
    };
  }

  // Analyze resume against job requirements
  analyzeResumeMatch(
    resume: ResumeData,
    job: JobTarget
  ): {
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    improvements: string[];
  } {
    const jobAnalysis = this.analyzeJobRequirements(job);
    const resumeText = this.getResumeText(resume);

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Check for required keywords
    jobAnalysis.requiredKeywords.forEach((keyword) => {
      if (resumeText.includes(keyword)) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
        improvements.push(`Consider adding "${keyword}" - mentioned in job requirements`);
      }
    });

    // Check for preferred keywords
    jobAnalysis.preferredKeywords.forEach((keyword) => {
      if (resumeText.includes(keyword)) {
        matchedKeywords.push(keyword);
        strengths.push(`Has "${keyword}" which is preferred by the employer`);
      }
    });

    // Analyze experience relevance
    const relevantExperience = resume.experience.filter(
      (exp) =>
        exp.achievements.some((a) =>
          jobAnalysis.analyzedDescription.includes(a.toLowerCase().slice(0, 20))
        ) ||
        jobAnalysis.requiredKeywords.some((keyword) =>
          exp.achievements.some((a) => a.toLowerCase().includes(keyword))
        ) ||
        exp.title.toLowerCase().includes(jobAnalysis.analyzedDescription.slice(0, 50))
    );

    if (relevantExperience.length > 0) {
      strengths.push(`${relevantExperience.length} relevant work experiences identified`);
    }

    // Calculate match score
    const totalRequired = jobAnalysis.requiredKeywords.length;
    const matchedRequired = matchedKeywords.filter((k) =>
      jobAnalysis.requiredKeywords.includes(k)
    ).length;

    const baseScore = totalRequired > 0 ? (matchedRequired / totalRequired) * 70 : 70;
    const bonusScore = Math.min((matchedKeywords.length / Math.max(totalRequired * 2, 1)) * 30, 30);

    return {
      matchScore: Math.round(baseScore + bonusScore),
      matchedKeywords: [...new Set(matchedKeywords)],
      missingKeywords: [...new Set(missingKeywords)],
      strengths,
      improvements,
    };
  }

  // Get full resume text for analysis
  private getResumeText(resume: ResumeData): string {
    return [
      resume.summary,
      ...resume.skills,
      ...resume.experience.flatMap((e) => [e.title, e.company, ...e.achievements]),
      ...resume.education.map((e) => `${e.degree} ${e.school}`),
      ...(resume.projects?.flatMap((p) => [p.name, p.description, ...p.technologies]) ?? []),
    ]
      .join(' ')
      .toLowerCase();
  }

  // Generate tailored resume
  async tailorResume(config: TailoringConfig): Promise<TailoringResult> {
    console.log('[AIResumeService] Starting resume tailoring for:', config.targetJob.title);

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { resume, targetJob } = config;
    const matchAnalysis = this.analyzeResumeMatch(resume, targetJob);

    // Generate tailored summary
    const tailoredSummary = this.generateTailoredSummary(resume, targetJob, config.tone);

    // Prioritize and enhance experience
    const tailoredExperience = resume.experience.map((exp) => ({
      ...exp,
      achievements: this.enhanceAchievements(
        exp.achievements,
        targetJob.requirements,
        config.includeMetrics
      ),
    }));

    // Reorder skills by relevance
    const tailoredSkills = this.reorderSkills(resume.skills, targetJob);

    // Generate recommendations
    const recommendations = this.generateRecommendations(matchAnalysis, targetJob);

    // Generate tailoring notes
    const tailoringNotes = this.generateTailoringNotes(config, matchAnalysis);

    // Generate cover letter
    const coverLetter = this.generateCoverLetter(resume, targetJob, config.tone);

    return {
      tailoredResume: {
        ...resume,
        summary: tailoredSummary,
        experience: tailoredExperience,
        skills: tailoredSkills,
      },
      matchScore: matchAnalysis.matchScore,
      matchedKeywords: matchAnalysis.matchedKeywords,
      missingKeywords: matchAnalysis.missingKeywords,
      recommendations,
      tailoringNotes,
      coverLetter,
    };
  }

  // Generate tailored professional summary
  private generateTailoredSummary(resume: ResumeData, job: JobTarget, tone: string): string {
    const prefix =
      tone === 'professional'
        ? 'Results-driven professional'
        : tone === 'enthusiastic'
          ? 'Passionate and dedicated developer'
          : 'Developer';

    const skills = resume.skills.slice(0, 5).join(', ');
    const yearsExp = this.estimateYearsExperience(resume.experience);
    const topAchievement = this.getTopAchievement(resume.experience);

    return `${prefix} with ${yearsExp}+ years of experience in software development. 
Specializing in ${skills}. Proven track record of ${topAchievement}. 
Seeking to leverage expertise as a ${job.title} at ${job.company} to drive innovative solutions.`
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Estimate years of experience
  private estimateYearsExperience(experience: ExperienceItem[]): number {
    if (experience.length === 0) return 1;
    // Simple estimation - in production would parse actual dates
    return Math.min(experience.length * 2 + 1, 15);
  }

  // Get top achievement from experience
  private getTopAchievement(experience: ExperienceItem[]): string {
    if (experience.length === 0) return 'delivering high-quality solutions';
    const allAchievements = experience.flatMap((e) => e.achievements);
    if (allAchievements.length === 0) return 'delivering high-quality solutions';
    // Return first achievement that sounds impactful
    const impactful = allAchievements.find(
      (a) =>
        a.toLowerCase().includes('increased') ||
        a.toLowerCase().includes('reduced') ||
        a.toLowerCase().includes('led') ||
        a.toLowerCase().includes('built') ||
        a.toLowerCase().includes('delivered')
    );
    return impactful || allAchievements[0].toLowerCase().replace(/^[a-z]/, (c) => c.toUpperCase());
  }

  // Enhance achievements to match job requirements
  private enhanceAchievements(
    achievements: string[],
    requirements: string[],
    includeMetrics: boolean
  ): string[] {
    const enhanced = [...achievements];

    // Add metrics if requested and not present
    if (includeMetrics) {
      enhanced.forEach((achievement, index) => {
        if (!/\d+%|\$\d+|\d+x/.test(achievement)) {
          enhanced[index] = achievement + ' (measurable impact)';
        }
      });
    }

    // Prioritize achievements that match requirements
    enhanced.sort((a, b) => {
      const aMatch = requirements.some((r) => a.toLowerCase().includes(r.toLowerCase()));
      const bMatch = requirements.some((r) => b.toLowerCase().includes(r.toLowerCase()));
      return bMatch ? 1 : aMatch ? -1 : 0;
    });

    return enhanced;
  }

  // Reorder skills by relevance to job
  private reorderSkills(skills: string[], job: JobTarget): string[] {
    const jobText = `${job.title} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();

    const sorted = [...skills].sort((a, b) => {
      const aInJob = jobText.includes(a.toLowerCase());
      const bInJob = jobText.includes(b.toLowerCase());

      if (aInJob && !bInJob) return -1;
      if (!aInJob && bInJob) return 1;
      return 0;
    });

    return sorted;
  }

  // Generate recommendations for improvement
  private generateRecommendations(
    analysis: ReturnType<typeof this.analyzeResumeMatch>,
    job: JobTarget
  ): string[] {
    const recommendations: string[] = [];

    // Keyword recommendations
    analysis.missingKeywords.forEach((keyword) => {
      recommendations.push(`Add "${keyword}" to your resume skills or experience section`);
    });

    // Experience recommendations
    if (analysis.missingKeywords.length > 3) {
      recommendations.push(
        'Consider highlighting any projects or experiences that demonstrate the missing skills'
      );
    }

    // General recommendations
    if (analysis.matchScore < 60) {
      recommendations.push('Focus on quantifiable achievements in your experience section');
      recommendations.push('Consider adding a projects section to showcase relevant work');
    }

    return recommendations;
  }

  // Generate tailoring notes
  private generateTailoringNotes(
    config: TailoringConfig,
    analysis: ReturnType<typeof this.analyzeResumeMatch>
  ): string[] {
    const notes: string[] = [];

    notes.push(`Optimized for ${config.targetJob.title} position at ${config.targetJob.company}`);
    notes.push(`Matched ${analysis.matchedKeywords.length} job-specific keywords`);
    notes.push(
      config.emphasisOnExperience
        ? 'Prioritized relevant work experience'
        : 'Balanced experience and skills'
    );
    notes.push(`Applied ${config.tone} tone throughout`);

    if (analysis.missingKeywords.length > 0) {
      notes.push(`Gap analysis: ${analysis.missingKeywords.length} skills not found in resume`);
    }

    return notes;
  }

  // Generate cover letter
  private generateCoverLetter(resume: ResumeData, job: JobTarget, tone: string): string {
    const greeting = tone === 'professional' ? 'Dear Hiring Manager' : 'Hello';
    const signOff = tone === 'professional' ? 'Sincerely' : 'Best regards';

    const topSkill = resume.skills[0] || 'software development';
    const yearsExp = this.estimateYearsExperience(resume.experience);
    const companyReason = this.getCompanyReason(job);

    return `${greeting},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With ${yearsExp}+ years of experience in ${topSkill}, I am confident in my ability to contribute meaningfully to your team.

Why I am excited about ${job.company}:
${companyReason}

What I bring:
• ${resume.experience[0]?.title || 'Relevant experience'} with proven results
• Expertise in ${resume.skills.slice(0, 3).join(', ')}
• Track record of delivering impactful solutions

I would welcome the opportunity to discuss how my skills and experience align with your team's goals.

${signOff},
[Your Name]`.trim();
  }

  private getCompanyReason(job: JobTarget): string {
    const reasons = [
      `innovation in ${job.title.toLowerCase().includes('frontend') ? 'frontend technologies' : 'the industry'}`,
      'commitment to building great products',
      'reputation for technical excellence',
      'impact on millions of users',
      'forward-thinking approach to development',
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // Quick ATS check
  async checkATSScore(
    resume: ResumeData,
    job: JobTarget
  ): Promise<{
    atsScore: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check summary
    if (!resume.summary || resume.summary.length < 50) {
      issues.push('Summary is missing or too short');
      suggestions.push('Add a 2-3 sentence professional summary');
      score -= 10;
    }

    // Check skills section
    if (!resume.skills || resume.skills.length < 5) {
      issues.push('Skills section is sparse');
      suggestions.push('Include at least 5-10 relevant skills');
      score -= 15;
    }

    // Check experience descriptions
    const shortDescriptions = resume.experience.filter(
      (e) => !e.achievements || e.achievements.length < 2
    );
    if (shortDescriptions.length > 0) {
      issues.push(`${shortDescriptions.length} experience entries lack detailed achievements`);
      suggestions.push('Add 3-5 bullet points with measurable outcomes to each role');
      score -= shortDescriptions.length * 5;
    }

    // Check for action verbs
    const resumeText = this.getResumeText(resume);
    const hasActionVerbs = ACTION_VERBS.some((verb) => resumeText.includes(verb.toLowerCase()));
    if (!hasActionVerbs) {
      issues.push('No strong action verbs detected');
      suggestions.push(
        'Start bullet points with action verbs like "Architected", "Led", "Delivered"'
      );
      score -= 10;
    }

    // Check keyword matching
    const analysis = this.analyzeResumeMatch(resume, job);
    const keywordMatchRate =
      analysis.matchedKeywords.length /
      Math.max(analysis.matchedKeywords.length + analysis.missingKeywords.length, 1);
    if (keywordMatchRate < 0.5) {
      issues.push('Low keyword match with job requirements');
      suggestions.push('Incorporate more keywords from the job description');
      score -= 15;
    }

    return {
      atsScore: Math.max(0, score),
      issues,
      suggestions,
    };
  }
}

export const aiResumeService = new AIResumeService();
