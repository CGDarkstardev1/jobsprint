/**
 * ATS Resume Optimization Engine
 * Combines best features from JobLand.ai, Jobscan, Rezi, and Kickresume
 * Implements keyword extraction, ATS optimization scoring, and format standardization
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface ResumeAnalysis {
  originalResume: string;
  atsScore: number;
  missingKeywords: string[];
  keywordDensity: Record<string, number>;
  formattingIssues: string[];
  suggestedImprovements: string[];
}

export interface JobDescription {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  salary: string;
  company: string;
  industry: string;
}

export interface OptimizedResume {
  optimizedContent: string;
  atsScore: number;
  keywordImprovements: Record<string, string>;
  formatting: string;
  sections: {
    summary: string;
    experience: string[];
    skills: string[];
    education: string;
    certifications: string;
  };
}

export interface ATSOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  scoreImprovement: number;
  keywordsAdded: string[];
  atsCompatibilityScore: number;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ATSResumeOptimizerService {
  private criticalKeywords = [
    'managed', 'developed', 'led', 'created', 'improved', 'achieved',
    'increased', 'decreased', 'designed', 'implemented', 'coordinated',
    'responsible', 'strategic', 'analyzed', 'maintained', 'supported', 'delivered',
    'optimized', 'automated', 'streamlined', 'launched', 'grew', 'reduced',
    'experienced', 'skilled', 'proficient', 'expert', 'senior', 'junior',
    'project', 'process', 'system', 'program', 'application', 'database',
    'infrastructure', 'architecture', 'framework', 'library', 'algorithm', 'data',
    'analytics', 'metrics', 'performance', 'quality', 'testing', 'deployment',
    'integration', 'interface', 'api', 'frontend', 'backend', 'full-stack',
    'cloud', 'aws', 'azure', 'google', 'microservices', 'devops',
    'agile', 'scrum', 'kanban', 'waterfall', 'sprint', 'iteration',
    'collaboration', 'communication', 'leadership', 'mentoring', 'training',
    'certification', 'bachelor', 'master', 'phd', 'computer science',
    'engineering', 'software', 'hardware', 'network', 'security', 'compliance'
  ];

  private industrySpecificTerms = {
    'technology': ['software', 'development', 'programming', 'coding', 'frontend', 'backend',
      'database', 'cloud', 'devops', 'ai', 'machine learning', 'mobile'],
    'healthcare': ['healthcare', 'medical', 'clinical', 'patient', 'hospital', 'diagnosis',
      'treatment', 'pharmaceutical', 'fda', 'hipaa', 'emr', 'electronic health'],
    'finance': ['finance', 'financial', 'banking', 'investment', 'trading', 'risk',
      'compliance', 'audit', 'regulatory', 'fintech', 'blockchain', 'cryptocurrency'],
    'education': ['education', 'teaching', 'curriculum', 'student', 'learning', 'academic',
      'research', 'university', 'school', 'training', 'certification', 'degree'],
    'marketing': ['marketing', 'advertising', 'brand', 'digital', 'social', 'content',
      'seo', 'analytics', 'campaign', 'conversion', 'engagement', 'growth'],
    'sales': ['sales', 'revenue', 'customer', 'client', 'negotiation', 'closing',
      'pipeline', 'prospecting', 'account', 'relationship', 'business development']
  };

  constructor(private httpService: HttpService) {}

  /**
   * Extract keywords from job description using advanced NLP
   * Combines approaches from Jobscan and industry best practices
   */
  extractKeywords(jobDescription: string): string[] {
    const words = jobDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/);
    const filtered = words.filter(word => word.length > 2);

    // Filter critical keywords and industry terms
    const criticalFound = this.criticalKeywords.filter(keyword => 
      words.includes(keyword) || jobDescription.toLowerCase().includes(keyword)
    );

    // Extract technical skills, tools, and qualifications
    const technicalTerms = filtered.filter(word => 
      this.isTechnicalTerm(word)
    );

    // Find action verbs and achievements
    const actionVerbs = filtered.filter(word => 
      this.isActionVerb(word)
    );

    // Extract metrics and quantifiable results
    const quantifiableResults = filtered.filter(word => 
      this.isQuantifiable(word)
    );

    return [...new Set([...criticalFound, ...technicalTerms, ...actionVerbs, ...quantifiableResults])];
  }

export interface ResumeAnalysis {
  originalResume: string;
  atsScore: number;
  missingKeywords: string[];
  keywordDensity: Record<string, number>;
  formattingIssues: string[];
  suggestedImprovements: string[];
}

export interface JobDescription {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  salary: string;
  company: string;
  industry: string;
}

export interface OptimizedResume {
  optimizedContent: string;
  atsScore: number;
  keywordImprovements: Record<string, string>;
  formatting: string;
  sections: {
    summary: string;
    experience: string[];
    skills: string[];
    education: string;
    certifications: string;
  };
}

export interface ATSOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  scoreImprovement: number;
  keywordsAdded: string[];
  atsCompatibilityScore: number;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ATSResumeOptimizerService {
  private criticalKeywords = [
    'managed', 'developed', 'led', 'created', 'improved', 'achieved',
    'increased', 'decreased', 'designed', 'implemented', 'coordinated',
    'responsible', 'strategic', 'analyzed', 'maintained', 'supported', 'delivered',
    'optimized', 'automated', 'streamlined', 'launched', 'grew', 'reduced',
    'experienced', 'skilled', 'proficient', 'expert', 'senior', 'junior',
    'project', 'process', 'system', 'program', 'application', 'database',
    'infrastructure', 'architecture', 'framework', 'library', 'algorithm', 'data',
    'analytics', 'metrics', 'performance', 'quality', 'testing', 'deployment',
    'integration', 'interface', 'api', 'frontend', 'backend', 'full-stack',
    'cloud', 'aws', 'azure', 'google', 'microservices', 'devops',
    'agile', 'scrum', 'kanban', 'waterfall', 'sprint', 'iteration',
    'collaboration', 'communication', 'leadership', 'mentoring', 'training',
    'certification', 'bachelor', 'master', 'phd', 'computer science',
    'engineering', 'software', 'hardware', 'network', 'security', 'compliance'
  ];

  private industrySpecificTerms = {
    'technology': ['software', 'development', 'programming', 'coding', 'frontend', 'backend',
      'database', 'cloud', 'devops', 'ai', 'machine learning', 'mobile'],
    'healthcare': ['healthcare', 'medical', 'clinical', 'patient', 'hospital', 'diagnosis',
      'treatment', 'pharmaceutical', 'fda', 'hipaa', 'emr', 'electronic health'],
    'finance': ['finance', 'financial', 'banking', 'investment', 'trading', 'risk',
      'compliance', 'audit', 'regulatory', 'fintech', 'blockchain', 'cryptocurrency'],
    'education': ['education', 'teaching', 'curriculum', 'student', 'learning', 'academic',
      'research', 'university', 'school', 'training', 'certification', 'degree'],
    'marketing': ['marketing', 'advertising', 'brand', 'digital', 'social', 'content',
      'seo', 'analytics', 'campaign', 'conversion', 'engagement', 'growth'],
    'sales': ['sales', 'revenue', 'customer', 'client', 'negotiation', 'closing',
      'pipeline', 'prospecting', 'account', 'relationship', 'business development']
  };

  constructor(private http: HttpClient) {}

  /**
   * Extract keywords from job description using advanced NLP
   * Combines approaches from Jobscan and industry best practices
   */
  extractKeywords(jobDescription: string): string[] {
    const words = jobDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Filter critical keywords and industry terms
    const criticalFound = this.criticalKeywords.filter(keyword => 
      words.includes(keyword) || jobDescription.toLowerCase().includes(keyword)
    );

    // Extract technical skills, tools, and qualifications
    const technicalTerms = words.filter(word => 
      this.isTechnicalTerm(word)
    );

    // Find action verbs and achievements
    const actionVerbs = words.filter(word => 
      this.isActionVerb(word)
    );

    // Extract metrics and quantifiable results
    const quantifiableResults = words.filter(word => 
      this.isQuantifiable(word)
    );

    return [...new Set([...criticalFound, ...technicalTerms, ...actionVerbs, ...quantifiableResults])];
  }

  /**
   * Analyze resume content for ATS compatibility
   * Implements scoring algorithm from Jobscan with enhanced metrics
   */
  analyzeResume(resumeContent: string, jobDescription: string): ResumeAnalysis {
    const jdKeywords = this.extractKeywords(jobDescription);
    const resumeWords = resumeContent.toLowerCase().split(/\s+/);

    // Calculate keyword density
    const keywordDensity: Record<string, number> = {};
    jdKeywords.forEach(keyword => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}[\]/.*]/, 'gi'));
      const matches = resumeContent.match(regex) || [];
      keywordDensity[keyword] = matches.length;
    });

    // Check ATS formatting issues
    const formattingIssues = this.checkATSFormatting(resumeContent);

    // Calculate ATS score based on multiple factors
    const atsScore = this.calculateATSScore(resumeContent, jobDescription, keywordDensity);

    // Identify missing keywords
    const missingKeywords = jdKeywords.filter(keyword => 
      !keywordDensity[keyword] || keywordDensity[keyword] === 0
    );

    // Generate improvement suggestions
    const suggestedImprovements = this.generateImprovementSuggestions(
      missingKeywords, formattingIssues, keywordDensity
    );

    return {
      originalResume: resumeContent,
      atsScore,
      keywordDensity,
      formattingIssues,
      suggestedImprovements
    };
  }

  /**
   * Optimize resume content for ATS compatibility
   * Implements best practices from Teal and Kickresume
   */
  optimizeResume(resumeContent: string, jobDescription: string): ATSOptimizationResult {
    const analysis = this.analyzeResume(resumeContent, jobDescription);
    const jdKeywords = this.extractKeywords(jobDescription);

    // Generate optimized content
    let optimizedContent = resumeContent;

    // 1. Inject missing keywords naturally
    optimizedContent = this.injectKeywordsNaturally(optimizedContent, analysis.missingKeywords);

    // 2. Improve formatting for ATS compatibility
    optimizedContent = this.standardizeATSFormat(optimizedContent);

    // 3. Enhance bullet points with action verbs and metrics
    optimizedContent = this.enhanceBulletPoints(optimizedContent, jdKeywords);

    // 4. Reorder sections for optimal ATS parsing
    const sections = this.extractSections(optimizedContent);
    const reorderedSections = this.reorderSectionsForATS(sections);

    optimizedContent = this.rebuildResume(reorderedSections);

    // Calculate final scores
    const newScore = this.calculateATSScore(optimizedContent, jobDescription, 
      this.extractKeywords(optimizedContent).reduce((acc, keyword) => {
        acc[keyword] = (optimizedContent.toLowerCase().match(new RegExp(keyword, 'gi')) || []).length;
        return acc;
      }, {})
    );

    return {
      originalContent: resumeContent,
      optimizedContent,
      scoreImprovement: newScore.atsScore - analysis.atsScore,
      keywordsAdded: analysis.missingKeywords,
      atsCompatibilityScore: newScore.atsScore,
      recommendations: this.generateFinalRecommendations(analysis, newScore)
    };
  }

  /**
   * Calculate comprehensive ATS score
   * Multi-factor scoring similar to Jobscan's algorithm
   */
  private calculateATSScore(resume: string, jobDescription: string, keywordDensity: Record<string, number>): { atsScore: number; details: any } {
    let score = 0;

    // Keyword matching (40% of score)
    const keywordScore = this.calculateKeywordMatchScore(keywordDensity);
    score += keywordScore * 0.4;

    // Format compatibility (25% of score)
    const formatScore = this.calculateFormatScore(resume);
    score += formatScore * 0.25;

    // Action verbs and achievements (20% of score)
    const actionScore = this.calculateActionScore(resume);
    score += actionScore * 0.2;

    // Experience relevance (15% of score)
    const experienceScore = this.calculateExperienceRelevance(resume, jobDescription);
    score += experienceScore * 0.15;

    return { atsScore: Math.round(score) };
  }

  /**
   * Natural keyword injection without keyword stuffing
   * Advanced approach from Resume.io and Kickresume
   */
  private injectKeywordsNaturally(content: string, keywords: string[]): string {
    if (keywords.length === 0) return content;

    let optimizedContent = content;
    const sentences = content.split(/[.!?]+/);

    keywords.forEach(keyword => {
      // Find best places to inject keywords naturally
      sentences.forEach((sentence, index) => {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) return;

        // Contextual keyword injection
        if (this.canInjectNaturally(sentence, keyword)) {
          const injectionPatterns = [
            `utilizing ${keyword}`,
            `leveraging ${keyword}`,
            `with expertise in ${keyword}`,
            `proficient in ${keyword}`,
            `experience with ${keyword}`,
            `knowledge of ${keyword}`
          ];

          const pattern = injectionPatterns[Math.floor(Math.random() * injectionPatterns.length)];
          sentences[index] = sentence.replace(
            new RegExp(`\\b${keyword}\\b`, 'gi'),
            pattern
          );
        }
      });
    });

    return sentences.join('. ');
  }

  /**
   * Standardize resume format for ATS systems
   * Combines best practices from multiple ATS optimization tools
   */
  private standardizeATSFormat(content: string): string {
    // Use clean, readable fonts
    let formatted = content.replace(/(?:\b(?:Arial|Times|Calibri|Georgia|Verdana)\b)/gi, 'Arial');

    // Ensure proper section headings
    const sectionHeaders = [
      'PROFESSIONAL SUMMARY',
      'EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'CERTIFICATIONS',
      'PROJECTS',
      'AWARDS'
    ];

    // Standardize date formats
    formatted = formatted.replace(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g, '$1/20$2/$3');

    // Remove special characters that confuse ATS
    formatted = formatted.replace(/[^\w\s\.\,\-\n\(\)\[\]\/]/g, '');

    return formatted;
  }

  /**
   * Enhance bullet points with action verbs and quantifiable results
   * STAR method implementation from best practice tools
   */
  private enhanceBulletPoints(content: string, keywords: string[]): string {
    const lines = content.split('\n');
    const actionVerbs = [
      'Led', 'Managed', 'Developed', 'Implemented', 'Created', 'Launched', 'Optimized',
      'Increased', 'Decreased', 'Improved', 'Reduced', 'Generated', 'Automated',
      'Designed', 'Built', 'Deployed', 'Mentored', 'Coordinated', 'Achieved'
    ];

    return lines.map(line => {
      // Check if it's a bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return this.enhanceBulletPoint(line, actionVerbs, keywords);
      }
      return line;
    }).join('\n');
  }

  /**
   * Generate comprehensive optimization recommendations
   */
  private generateFinalRecommendations(original: ResumeAnalysis, optimized: ResumeAnalysis): string[] {
    const recommendations: string[] = [];

    if (optimized.atsScore > original.atsScore) {
      recommendations.push('✅ ATS compatibility improved significantly');
    }

    if (optimized.atsScore >= 85) {
      recommendations.push('✅ Resume is now ATS-optimized');
    }

    if (optimized.missingKeywords.length === 0) {
      recommendations.push('✅ All critical keywords included');
    }

    if (optimized.formattingIssues.length < original.formattingIssues.length) {
      recommendations.push('✅ Formatting issues resolved');
    }

    // Additional best practice recommendations
    recommendations.push('📈 Consider adding quantifiable achievements');
    recommendations.push('🎯 Tailor resume for each specific application');
    recommendations.push('📊 Use this optimized version for ATS systems');

    return recommendations;
  }

  // Helper methods
  private isTechnicalTerm(word: string): boolean {
    const techTerms = ['javascript', 'python', 'java', 'react', 'node', 'aws', 'docker', 
      'kubernetes', 'sql', 'nosql', 'git', 'ci/cd', 'microservices'];
    return techTerms.includes(word.toLowerCase());
  }

  private isActionVerb(word: string): boolean {
    const actionWords = ['managed', 'developed', 'led', 'created', 'implemented', 'achieved',
      'improved', 'increased', 'decreased', 'designed', 'launched', 'optimized'];
    return actionWords.includes(word.toLowerCase());
  }

  private isQuantifiable(word: string): boolean {
    const numberPattern = /\d+/;
    const percentPattern = /\d+%/;
    const currencyPattern = /\$\d+/;
    return numberPattern.test(word) || percentPattern.test(word) || currencyPattern.test(word);
  }

  private checkATSFormatting(content: string): string[] {
    const issues: string[] = [];

    // Check for problematic elements
    if (content.includes('|') || content.includes('→')) {
      issues.push('Contains special characters that confuse ATS');
    }

    if (/[A-Z]{4,}/.test(content)) {
      issues.push('Contains ALL CAPS text');
    }

    if (content.length > 15000) {
      issues.push('Resume too long for some ATS systems');
    }

    if (!content.match(/\b(Experience|Skills|Education|Summary)\b/i)) {
      issues.push('Missing standard section headers');
    }

    return issues;
  }

  private calculateKeywordMatchScore(density: Record<string, number>): number {
    const totalPossibleKeywords = this.criticalKeywords.length;
    const matchedKeywords = Object.values(density).filter(count => count > 0).length;
    return (matchedKeywords / totalPossibleKeywords) * 100;
  }

  private calculateFormatScore(content: string): number {
    let score = 100;

    if (this.checkATSFormatting(content).length > 0) {
      score -= 20;
    }

    // Check for proper structure
    const hasStandardSections = /\b(?:Experience|Skills|Education|Summary)\b/i.test(content);
    if (!hasStandardSections) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private calculateActionScore(content: string): number {
    const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'achieved'];
    const words = content.toLowerCase().split(/\s+/);
    const actionCount = words.filter(word => actionVerbs.includes(word)).length;
    return Math.min(100, (actionCount / words.length) * 100);
  }

  private calculateExperienceRelevance(resume: string, jobDescription: string): number {
    // Simplified relevance scoring based on experience level matching
    const experienceLevels = {
      'entry': ['entry', 'junior', 'associate', 'intern'],
      'mid': ['mid', 'middle', 'associate', '3-5', '3-7'],
      'senior': ['senior', 'lead', 'principal', '5-10', '7+'],
      'executive': ['executive', 'director', 'vp', 'manager', 'head']
    };

    let maxScore = 0;
    Object.entries(experienceLevels).forEach(([level, terms]) => {
      const levelScore = terms.reduce((score, term) => {
        const resumeCount = (resume.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const jdCount = (jobDescription.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        return score + Math.min(resumeCount, jdCount);
      }, 0);
      maxScore = Math.max(maxScore, levelScore);
    });

    return maxScore;
  }

  private enhanceBulletPoint(bullet: string, actionVerbs: string[], keywords: string[]): string {
    let enhanced = bullet;

    // Add action verb if missing
    const hasActionVerb = actionVerbs.some(verb => 
      bullet.toLowerCase().includes(verb.toLowerCase())
    );

    if (!hasActionVerb) {
      const firstWord = bullet.split(/\s+/)[0]?.replace(/[^\w]/g, '');
      if (firstWord && !actionVerbs.includes(firstWord.toLowerCase())) {
        enhanced = actionVerbs[0] + ' ' + bullet;
      }
    }

    // Add keywords if relevant
    keywords.forEach(keyword => {
      if (!bullet.toLowerCase().includes(keyword.toLowerCase()) && 
          this.canInjectNaturally(bullet, keyword)) {
        // Find contextually appropriate place to add keyword
        if (bullet.includes('experience') || bullet.includes('developed')) {
          enhanced = bullet.replace(/\b(developed|develop)\b/i, `developed ${keyword}`);
        }
      }
    });

    return enhanced;
  }

  private canInjectNaturally(sentence: string, keyword: string): boolean {
    // Check if keyword fits naturally in sentence context
    const contextWords = ['skills', 'experience', 'knowledge', 'expertise', 'proficient', 
      'familiar', 'worked', 'utilized', 'managed', 'handled'];
    return contextWords.some(word => sentence.toLowerCase().includes(word.toLowerCase()));
  }

  private extractSections(content: string): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    const lines = content.split('\n');
    let currentSection = 'Summary';
    let currentContent: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (this.isSectionHeader(trimmedLine)) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent;
        }
        currentSection = trimmedLine.replace(/[:\-]/, '').trim();
        currentContent = [];
      } else if (trimmedLine.length > 0) {
        currentContent.push(trimmedLine);
      }
    });

    // Add last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent;
    }

    return sections;
  }

  private isSectionHeader(line: string): boolean {
    const sectionHeaders = ['Summary', 'Experience', 'Skills', 'Education', 'Certifications', 'Projects'];
    return sectionHeaders.some(header => 
      line.replace(/[:\-]/, '').trim().toLowerCase() === header.toLowerCase()
    );
  }

  private reorderSectionsForATS(sections: Record<string, string[]>): Record<string, string[]> {
    const optimalOrder = [
      'Summary', 'Experience', 'Skills', 'Education', 'Certifications', 'Projects'
    ];

    const reordered: Record<string, string[]> = {};
    optimalOrder.forEach(section => {
      if (sections[section]) {
        reordered[section] = sections[section];
      }
    });

    return reordered;
  }

  private rebuildResume(sections: Record<string, string[]>): string {
    let resume = '';

    Object.entries(sections).forEach(([section, content]) => {
      resume += `${section.toUpperCase()}\n`;
      resume += content.join('\n');
      resume += '\n\n';
    });

    return resume.trim();
  }
}