/**
 * ATS Evasion Engine - Bleeding Edge Resume Optimization
 * 
 * Features:
 * - Smart Keyword Contextualization (Rewrites bullet points)
 * - Metadata Injection (Hidden semantic layers)
 * - Format Sanitization (Removing parsing blockers)
 * - Zero-Width Space Injection (Theoretical, for experimental stealth)
 */

import { JobData, ResumeData } from './atsChecker';

export interface EvasionResult {
  optimizedResume: ResumeData;
  stealthScore: number; // How "undetectable" the optimization is
  injectedKeywords: string[];
  metadata: Record<string, string>;
  formatWarnings: string[];
}

export class ATSEvasionEngine {
  
  // High-value ATS Keywords that trigger high ranking
  private readonly POWER_KEYWORDS = [
    'Led', 'Architected', 'Spearheaded', 'Optimized', 'Delivered', 
    'Scalable', 'High-performance', 'Cross-functional', 'Strategic', 
    'Revenue', 'Growth', 'Automation', 'CI/CD', 'Cloud-native'
  ];

  /**
   * Main entry point for evasion tactics
   */
  evade(resume: ResumeData, job: JobData): EvasionResult {
    const jobKeywords = this.extractJobKeywords(job);
    const optimizedResume = this.optimizeContent(resume, jobKeywords);
    
    return {
      optimizedResume,
      stealthScore: this.calculateStealthScore(resume, optimizedResume),
      injectedKeywords: jobKeywords,
      metadata: this.generateMetadata(resume, job),
      formatWarnings: this.checkFormattingRisks(resume)
    };
  }

  /**
   * Rewrites content to naturally include keywords
   * "Contextual Embedding"
   */
  private optimizeContent(resume: ResumeData, targetKeywords: string[]): ResumeData {
    const newResume = JSON.parse(JSON.stringify(resume)); // Deep copy

    // 1. Optimize Summary
    newResume.summary = this.injectIntoSummary(newResume.summary, targetKeywords);

    // 2. Optimize Experience Bullet Points
    newResume.experience = newResume.experience.map((exp: any) => ({
      ...exp,
      description: this.injectIntoDescription(exp.description, targetKeywords)
    }));

    // 3. Skills Section Expansion (The "Kitchen Sink" approach, but organized)
    newResume.skills = [...new Set([...newResume.skills, ...targetKeywords])];

    return newResume;
  }

  private extractJobKeywords(job: JobData): string[] {
    // Simple extraction for now, would use NLP in production
    const text = (job.description + ' ' + (job.requirements || []).join(' ')).toLowerCase();
    
    // Filter against known tech stack
    // In a real implementation, this would use the global TECH_KEYWORDS or an LLM
    const commonTech = ['react', 'typescript', 'node.js', 'aws', 'python', 'docker', 'kubernetes'];
    return commonTech.filter(k => text.includes(k));
  }

  private injectIntoSummary(summary: string, keywords: string[]): string {
    // Naive injection for prototype: Append if not present
    // "Bleeding Edge" version would rewrite the sentence structure
    const missing = keywords.filter(k => !summary.toLowerCase().includes(k));
    if (missing.length === 0) return summary;

    return `${summary} Expertise includes: ${missing.join(', ')}.`;
  }

  private injectIntoDescription(description: string, keywords: string[]): string {
    // Inject power keywords into descriptions
    // Convert "Did X" to "Architected X using [Keyword]"
    
    let optimized = description;
    
    // Simple replacement strategy for demo
    if (keywords.includes('react') && !description.toLowerCase().includes('react')) {
      optimized += " Implemented robust frontend solutions using React ecosystem.";
    }
    
    return optimized;
  }

  private generateMetadata(resume: ResumeData, job: JobData): Record<string, string> {
    // Metadata that PDF parsers often read but humans don't see
    return {
      'Title': `${resume.summary?.split(' ')[0] || 'Professional'} - ${job.title}`,
      'Author': 'JobSprint Optimized Candidate',
      'Subject': `Application for ${job.title}`,
      'Keywords': [...resume.skills, ...this.extractJobKeywords(job)].join(', '),
      'Creator': 'Microsoft Word (Optimized)', // Fake the creator to look "native"
      'Producer': 'Microsoft Word (Optimized)' 
    };
  }

  private checkFormattingRisks(resume: ResumeData): string[] {
    const risks = [];
    // Check for things that confuse ATS
    // 1. Columns (hard to detect in JSON, but we warn generally)
    risks.push("Ensure PDF is single-column. Multi-column layouts confuse 40% of ATS.");
    
    // 2. Images/Icons
    risks.push("Remove all icons and headshots. They can cause OCR failures.");
    
    // 3. Tables
    risks.push("Do not use tables for layout. Use tab stops.");

    return risks;
  }

  private calculateStealthScore(original: ResumeData, optimized: ResumeData): number {
    // Calculate how "natural" the changes look
    // If we added too many keywords, score drops (spam detection risk)
    const originalLen = JSON.stringify(original).length;
    const newLen = JSON.stringify(optimized).length;
    const ratio = newLen / originalLen;
    
    if (ratio > 1.5) return 60; // Suspicious growth
    return 95; // Stealthy
  }
}

export const atsEvasionEngine = new ATSEvasionEngine();
