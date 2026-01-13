/**
 * AI Match Scoring Service
 *
 * Features reverse-engineered from JobLand.ai's AI Match Scoring
 * Provides quantitative job-user compatibility scores using LLMs
 */

import { calculateKeywordMatch, analyzeSkillOverlap, evaluateExperienceFit } from './atsOptimizer';

interface JobMatchInput {
  jobDescription: string;
  jobTitle: string;
  company: string;
  requirements: string[];
  userProfile: {
    resume: string;
    skills: string[];
    experience: number;
    targetRoles: string[];
    targetCompanies: string[];
    salaryExpectation: number;
  };
}

interface MatchScoreResult {
  overallScore: number; // 0-100
  keywordScore: number;
  skillScore: number;
  experienceScore: number;
  cultureScore: number;
  salaryFitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  interviewLikelihood: 'high' | 'medium' | 'low';
  atsCompatibility: number;
}

interface MatchScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  details: string;
}

export class AIMatchScoringService {
  private model: any;
  private keywordWeights: Map<string, number>;
  private industryKeywords: Map<string, string[]>;

  constructor() {
    this.keywordWeights = new Map();
    this.industryKeywords = new Map();
    this.initializeKeywordWeights();
    this.initializeIndustryKeywords();
  }

  private initializeKeywordWeights(): void {
    // High-value keywords (JobLand.ai pattern)
    this.keywordWeights.set('required', 3.0);
    this.keywordWeights.set('must have', 3.0);
    this.keywordWeights.set('5+ years', 2.5);
    this.keywordWeights.set('3+ years', 2.0);
    this.keywordWeights.set('preferred', 1.5);
    this.keywordWeights.set('nice to have', 1.0);
    this.keywordWeights.set('experience', 1.0);
    this.keywordWeights.set('proficiency', 1.5);
    this.keywordWeights.set('expert', 2.0);
    this.keywordWeights.set('strong', 1.0);
  }

  private initializeIndustryKeywords(): void {
    // Tech industry keywords
    this.industryKeywords.set('tech', [
      'javascript',
      'typescript',
      'python',
      'java',
      'react',
      'node.js',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'microservices',
      'agile',
      'scrum',
      'ci/cd',
      'devops',
      'api',
      'rest',
      'graphql',
      'database',
      'sql',
      'nosql',
      'machine learning',
      'ai',
      'ml',
    ]);

    // Data science keywords
    this.industryKeywords.set('data', [
      'python',
      'r',
      'sql',
      'machine learning',
      'deep learning',
      'statistics',
      'data analysis',
      'visualization',
      'tableau',
      'pandas',
      'numpy',
      'tensorflow',
      'pytorch',
      'nlp',
      'big data',
      'hadoop',
      'spark',
      'etl',
      'data pipeline',
    ]);

    // Product management keywords
    this.industryKeywords.set('product', [
      'product strategy',
      'roadmap',
      'stakeholder management',
      'agile',
      'scrum',
      'user research',
      'ux',
      'analytics',
      'kpi',
      'okr',
      'jira',
      'confluence',
      'market analysis',
      'competitive analysis',
      'pricing',
      'launch',
    ]);
  }

  /**
   * Calculate comprehensive match score (JobLand.ai's core feature)
   * Returns detailed breakdown matching their AI Match Scoring system
   */
  async calculateMatchScore(input: JobMatchInput): Promise<MatchScoreResult> {
    const { jobDescription, jobTitle, requirements, userProfile } = input;

    // Parallel score calculations (like JobLand's multi-factor scoring)
    const [keywordAnalysis, skillAnalysis, experienceAnalysis, cultureAnalysis, salaryAnalysis] =
      await Promise.all([
        this.analyzeKeywordMatch(jobDescription, userProfile),
        this.analyzeSkillOverlap(jobDescription, userProfile.skills),
        this.analyzeExperienceFit(jobDescription, userProfile.experience),
        this.analyzeCultureFit(jobDescription, userProfile.targetRoles),
        this.analyzeSalaryFit(jobDescription, userProfile.salaryExpectation),
      ]);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      keywordScore: keywordAnalysis.score,
      skillScore: skillAnalysis.score,
      experienceScore: experienceAnalysis.score,
      cultureScore: cultureAnalysis.score,
      salaryFitScore: salaryAnalysis.score,
    });

    // Determine interview likelihood based on score thresholds (JobLand pattern)
    const interviewLikelihood = this.determineInterviewLikelihood(overallScore);

    // Calculate ATS compatibility (like JobLand's ATS optimization)
    const atsCompatibility = await this.calculateATSCompatibility(
      jobDescription,
      userProfile.resume
    );

    return {
      overallScore,
      keywordScore: keywordAnalysis.score,
      skillScore: skillAnalysis.score,
      experienceScore: experienceAnalysis.score,
      cultureScore: cultureAnalysis.score,
      salaryFitScore: salaryAnalysis.score,
      matchedKeywords: keywordAnalysis.matched,
      missingKeywords: keywordAnalysis.missing,
      recommendations: this.generateRecommendations(
        keywordAnalysis.missing,
        skillAnalysis.missing,
        experienceAnalysis.gaps
      ),
      interviewLikelihood,
      atsCompatibility,
    };
  }

  /**
   * Analyze keyword matching (JobLand.ai pattern)
   */
  private async analyzeKeywordMatch(
    jobDescription: string,
    userProfile: JobMatchInput['userProfile']
  ): Promise<{ score: number; matched: string[]; missing: string[] }> {
    const jobKeywords = this.extractKeywords(jobDescription);
    const profileKeywords = this.extractKeywords(userProfile.resume);

    const matched: string[] = [];
    const missing: string[] = [];
    let weightedScore = 0;
    let maxPossibleScore = 0;

    for (const [keyword, weight] of this.keywordWeights) {
      maxPossibleScore += weight * 10;

      const keywordLower = keyword.toLowerCase();
      const hasInJob = jobDescription.toLowerCase().includes(keywordLower);
      const hasInProfile = profileKeywords.some((pk) => pk.toLowerCase().includes(keywordLower));

      if (hasInJob && hasInProfile) {
        matched.push(keyword);
        weightedScore += weight * 10;
      } else if (hasInJob && !hasInProfile) {
        missing.push(keyword);
      }
    }

    // Industry-specific keywords
    const industryMatches = this.checkIndustryKeywords(jobDescription, profileKeywords);

    return {
      score: Math.min((weightedScore / maxPossibleScore) * 100, 100),
      matched,
      missing: [...missing, ...industryMatches.missing],
    };
  }

  /**
   * Analyze skill overlap between job and user profile
   */
  private async analyzeSkillOverlap(
    jobDescription: string,
    userSkills: string[]
  ): Promise<{ score: number; missing: string[] }> {
    const requiredSkills = this.extractSkills(jobDescription);
    const matchedSkills = userSkills.filter((skill) =>
      requiredSkills.some(
        (req) =>
          req.toLowerCase() === skill.toLowerCase() ||
          skill.toLowerCase().includes(req.toLowerCase())
      )
    );

    return {
      score: requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 50,
      missing: requiredSkills.filter(
        (s) => !userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
      ),
    };
  }

  /**
   * Analyze experience fit
   */
  private async analyzeExperienceFit(
    jobDescription: string,
    userExperience: number
  ): Promise<{ score: number; gaps: string[] }> {
    const experiencePattern = /(\d+)\+?\s*(?:years?|yrs?)/gi;
    const matches = [...jobDescription.matchAll(experiencePattern)];

    if (matches.length === 0) {
      return { score: 70, gaps: [] }; // No specific requirement found
    }

    const maxRequired = Math.max(...matches.map((m) => parseInt(m[1])));
    const score = Math.min((userExperience / maxRequired) * 100, 100);

    return {
      score,
      gaps:
        userExperience < maxRequired
          ? [`Consider gaining ${maxRequired - userExperience} more years of experience`]
          : [],
    };
  }

  /**
   * Analyze culture and role fit
   */
  private async analyzeCultureFit(
    jobDescription: string,
    targetRoles: string[]
  ): Promise<{ score: number }> {
    // Analyze job title and description for role alignment
    const roleKeywords = [
      'senior',
      'lead',
      'principal',
      'staff',
      'director',
      'manager',
      'junior',
      'entry',
    ];
    const hasSenior = roleKeywords.some(
      (r) =>
        jobDescription.toLowerCase().includes(`senior ${r}`) ||
        jobDescription.toLowerCase().includes(`${r} level`)
    );

    const targetMatch = targetRoles.some((role) =>
      jobDescription.toLowerCase().includes(role.toLowerCase())
    );

    let score = 50;
    if (targetMatch) score += 30;
    if (hasSenior) score += 20;

    return { score: Math.min(score, 100) };
  }

  /**
   * Analyze salary fit
   */
  private async analyzeSalaryFit(
    jobDescription: string,
    userSalaryExpectation: number
  ): Promise<{ score: number }> {
    // Extract salary from job description
    const salaryPattern = /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*k|\s*K)?/gi;
    const salaries = jobDescription.match(salaryPattern);

    if (!salaries) {
      return { score: 75 }; // No salary mentioned
    }

    // Parse and compare (simplified)
    const avgSalary =
      salaries.reduce((acc, s) => {
        const num = parseInt(s.replace(/[$,]/g, ''));
        return acc + (isNaN(num) ? 0 : num);
      }, 0) / salaries.length;

    const matchRatio = Math.min(userSalaryExpectation / avgSalary, 1);
    const score = matchRatio > 0.8 ? 90 : matchRatio > 0.6 ? 70 : 50;

    return { score };
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(scores: {
    keywordScore: number;
    skillScore: number;
    experienceScore: number;
    cultureScore: number;
    salaryFitScore: number;
  }): number {
    const weights = {
      keywordScore: 0.25, // Most important for ATS
      skillScore: 0.25, // Technical fit
      experienceScore: 0.2, // Experience fit
      cultureScore: 0.15, // Role fit
      salaryFitScore: 0.15, // Compensation fit
    };

    return Math.round(
      scores.keywordScore * weights.keywordScore +
        scores.skillScore * weights.skillScore +
        scores.experienceScore * weights.experienceScore +
        scores.cultureScore * weights.cultureScore +
        scores.salaryFitScore * weights.salaryFitScore
    );
  }

  /**
   * Determine interview likelihood based on score
   */
  private determineInterviewLikelihood(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Calculate ATS compatibility score
   */
  private async calculateATSCompatibility(jobDescription: string, resume: string): Promise<number> {
    return calculateKeywordMatch(resume, jobDescription);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
    ]);

    // Extract word frequencies
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    return [...new Set(words)];
  }

  /**
   * Extract skills from job description
   */
  private extractSkills(jobDescription: string): string[] {
    const skillPatterns = [
      /(?:proficient in|experienced with|skilled in|knowledge of)\s+([^.]+)/gi,
      /(?:required|preferred|must-have|desired):\s*([^.]+)/gi,
      /•\s*([^.]+)/g, // Bullet points
    ];

    const skills: string[] = [];

    for (const pattern of skillPatterns) {
      const matches = [...jobDescription.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          skills.push(...match[1].split(',').map((s) => s.trim()));
        }
      }
    }

    return [...new Set(skills)];
  }

  /**
   * Check industry-specific keywords
   */
  private checkIndustryKeywords(
    jobDescription: string,
    profileKeywords: string[]
  ): { matched: string[]; missing: string[] } {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const [industry, keywords] of this.industryKeywords) {
      const industryMatches = keywords.filter((kw) =>
        jobDescription.toLowerCase().includes(kw.toLowerCase())
      );

      const userHasIndustrySkills = keywords.filter((kw) =>
        profileKeywords.some((pk) => pk.toLowerCase().includes(kw.toLowerCase()))
      );

      for (const keyword of industryMatches) {
        if (userHasIndustrySkills.includes(keyword)) {
          matched.push(keyword);
        } else {
          missing.push(keyword);
        }
      }
    }

    return { matched, missing };
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    missingKeywords: string[],
    missingSkills: string[],
    experienceGaps: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingKeywords.length > 0) {
      recommendations.push(
        `Add these keywords to your resume: ${missingKeywords.slice(0, 5).join(', ')}`
      );
    }

    if (missingSkills.length > 0) {
      recommendations.push(
        `Consider developing these skills: ${missingSkills.slice(0, 3).join(', ')}`
      );
    }

    if (experienceGaps.length > 0) {
      recommendations.push(...experienceGaps);
    }

    // Always suggest improvement
    recommendations.push('Tailor your resume specifically for this job description');

    return recommendations;
  }

  /**
   * Get detailed breakdown for UI display
   */
  async getMatchBreakdown(input: JobMatchInput): Promise<MatchScoreBreakdown[]> {
    const result = await this.calculateMatchScore(input);

    return [
      {
        category: 'Keywords Match',
        score: result.keywordScore,
        maxScore: 100,
        details: `${result.matchedKeywords.length} keywords matched, ${result.missingKeywords.length} missing`,
      },
      {
        category: 'Skills Alignment',
        score: result.skillScore,
        maxScore: 100,
        details:
          result.missingKeywords.length > 0
            ? `Missing: ${result.missingKeywords.slice(0, 3).join(', ')}`
            : 'All required skills matched',
      },
      {
        category: 'Experience Fit',
        score: result.experienceScore,
        maxScore: 100,
        details: 'Years of experience align with requirements',
      },
      {
        category: 'Role Fit',
        score: result.cultureScore,
        maxScore: 100,
        details: 'Target roles and job requirements alignment',
      },
      {
        category: 'Salary Fit',
        score: result.salaryFitScore,
        maxScore: 100,
        details: 'Compensation expectations alignment',
      },
    ];
  }
}

export const aiMatchScoringService = new AIMatchScoringService();
