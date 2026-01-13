/**
 * AI Cover Letter Generator
 * Combines best features from Rezi, Kickresume, and LazyApply
 * Implements company culture analysis, tone matching, and personalization
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export type CompanyCulture = {
  tone: 'professional' | 'casual' | 'innovative' | 'traditional' | 'startup';
  values: string[];
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  mission?: string;
  products?: string[];
};

export type CoverLetterAnalysis = {
  companyCulture: CompanyCulture;
  jobDescription: string;
  userSkills: string[];
  userProfile: any;
  toneMatch: number; // 0-100 score
  personalizationLevel: 'low' | 'medium' | 'high';
};

export type CoverLetterTemplate = {
  introduction: string;
  bodyParagraphs: string[];
  closing: string;
  callToAction: string;
  tone: string;
  personalizationNotes: string[];
};

export type GeneratedCoverLetter = {
  content: string;
  template: CoverLetterTemplate;
  tone: string;
  personalizationScore: number;
  companyAlignment: number;
  suggestions: string[];
};

export type CoverLetterGenerationRequest = {
  resume: string;
  jobDescription: string;
  userProfile: any;
  companyInfo?: {
    name: string;
    website: string;
    industry: string;
    about?: string;
  };
  tone?: 'professional' | 'casual' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
  keyPoints?: string[];
};

@Injectable({
  providedIn: 'root'
})
export class AICoverLetterGenerator {
  private readonly tonePatterns = {
    professional: [
      'I am excited to apply for this position',
      'My experience aligns perfectly with your requirements',
      'I am confident I can contribute to your team'
    ],
    casual: [
      'Hey there! I saw your opening and thought Id be perfect',
      'My background sounds like a great fit for what youre looking for',
      'Would love to chat more about how I can help'
    ],
    enthusiastic: [
      'This role seems absolutely perfect for me!',
      'Ive been following your company for years and would jump at this chance',
      'Your mission really resonates with my career goals'
    ]
  };

  private readonly industrySpecificTemplates = {
    technology: {
      introduction: 'As a passionate software developer with expertise in {keySkills}',
      body: ['My experience includes {years} of hands-on work with {technologies}', 
               'Ive successfully led projects that {achievement}', 
               'I am proficient in {technicalArea} with a focus on {specialization}'],
      closing: 'I am eager to discuss how my technical skills can benefit {companyName}'
    },
    healthcare: {
      introduction: 'As a dedicated healthcare professional with {years} of experience',
      body: ['My background includes {certifications} and specialized training in {specialty}',
               'I am committed to maintaining the highest standards of patient care and safety',
               'I have experience with {healthcareSystems} and electronic health records'],
      closing: 'I look forward to contributing my skills to your healthcare team'
    },
    finance: {
      introduction: 'As a financial professional with expertise in {financialArea}',
      body: ['My analytical skills and attention to detail have helped me {financeAchievement}',
               'I am proficient in {financialTools} and regulatory compliance',
               'I have a track record of {performanceMetric}'],
      closing: 'I am excited about the opportunity to bring my financial expertise to {companyName}'
    }
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Analyze company culture from website and job description
   * Advanced analysis similar to LazyApply's company intelligence
   */
  async analyzeCompanyCulture(companyName: string, companyWebsite?: string, jobDescription: string): Promise<CompanyCulture> {
    let culture: CompanyCulture = {
      tone: 'professional',
      values: [],
      industry: '',
      size: 'medium'
    };

    try {
      // Web scraping analysis (if website provided)
      if (companyWebsite) {
        const webContent = await this.analyzeWebsite(companyWebsite);
        culture = this.inferCultureFromWebContent(webContent, jobDescription);
      }

      // Job description analysis
      const jdCulture = this.inferCultureFromJobDescription(jobDescription);
      culture = this.mergeCultureAnalysis(culture, jdCulture);

      // Industry-specific adjustments
      if (jdCulture.industry) {
        culture = this.adjustCultureForIndustry(culture, jdCulture.industry);
      }

      return culture;
    } catch (error) {
      console.error(`Error analyzing company culture: ${error}`);
      return {
        tone: 'professional',
        values: ['Innovation', 'Excellence'],
        industry: 'general',
        size: 'medium'
      };
    }
  }

  /**
   * Generate personalized cover letter
   * Implements Rezi's AI-powered generation with LazyApply's personalization
   */
  async generateCoverLetter(request: CoverLetterGenerationRequest): Promise<GeneratedCoverLetter> {
    const analysis = await this.analyzeRequest(request);
    const template = await this.selectTemplate(request, analysis);
    const personalized = await this.personalizeTemplate(template, request, analysis);

    return {
      content: this.buildCoverLetterContent(personalized),
      template: personalized.template,
      tone: personalized.tone,
      personalizationScore: this.calculatePersonalizationScore(personalized),
      companyAlignment: analysis.companyAlignment,
      suggestions: this.generateSuggestions(personalized)
    };
  }

  /**
   * Analyze generation request
   */
  private async analyzeRequest(request: CoverLetterGenerationRequest): Promise<CoverLetterAnalysis> {
    return {
      companyCulture: await this.analyzeCompanyCulture(
        request.companyInfo?.name || '',
        request.companyInfo?.website,
        request.jobDescription
      ),
      jobDescription: request.jobDescription,
      userSkills: this.extractSkillsFromResume(request.resume),
      userProfile: request.userProfile,
      toneMatch: 0, // Will be calculated after generation
      personalizationLevel: 'medium'
    };
  }

  /**
   * Select optimal template based on analysis
   */
  private async selectTemplate(request: CoverLetterGenerationRequest, analysis: CoverLetterAnalysis): Promise<CoverLetterTemplate> {
    const industry = analysis.companyCulture.industry;
    const tone = request.tone || 'professional';

    // Industry-specific template selection
    if (this.industrySpecificTemplates[industry as keyof typeof this.industrySpecificTemplates]) {
      return this.industrySpecificTemplates[industry as keyof typeof this.industrySpecificTemplates];
    }

    // Generic professional template
    return {
      introduction: `Dear ${analysis.companyCulture.tone} Hiring Manager,`,
      bodyParagraphs: [
        `I am writing to express my strong interest in the ${this.extractJobTitle(request.jobDescription)} position at ${request.companyInfo?.name || 'your company'}.`,
        `Based on my background, I believe I would be a valuable asset to your team.`
      ],
      closing: `I look forward to discussing how my skills can contribute to ${request.companyInfo?.name || 'your company'}'${request.companyInfo?.name ? "'s" : ''} objectives.`,
      callToAction: 'Thank you for your consideration.',
      tone,
      personalizationNotes: []
    };
  }

  /**
   * Personalize template with AI
   * Advanced personalization combining multiple approaches
   */
  private async personalizeTemplate(template: CoverLetterTemplate, request: CoverLetterGenerationRequest, analysis: CoverLetterAnalysis): Promise<CoverLetterTemplate> {
    const personalized = { ...template };

    // 1. Add user skills and experience
    if (analysis.userSkills.length > 0) {
      personalized.bodyParagraphs[0] += ` My background includes ${analysis.userSkills.join(', ')}, which aligns well with your requirements.`;
    }

    // 2. Add company-specific elements
    if (request.companyInfo?.about) {
      personalized.bodyParagraphs[1] = ` I am particularly drawn to ${request.companyInfo?.about} and would be excited to contribute to this mission.`;
    }

    // 3. Address key points from job description
    const keyPoints = this.extractKeyPoints(request.jobDescription);
    if (keyPoints.length > 0) {
      personalized.bodyParagraphs.push(` I have experience in ${keyPoints.join(', ')}, which I believe would be immediately valuable.`);
    }

    // 4. Add personalization based on culture match
    const culturePersonalization = this.generateCulturePersonalization(analysis.companyCulture, request);
    if (culturePersonalization) {
      personalized.personalizationNotes.push(culturePersonalization);
    }

    return personalized;
  }

  /**
   * Build final cover letter content
   */
  private buildCoverLetterContent(personalized: CoverLetterTemplate): string {
    const content = [
      personalized.introduction,
      ...personalized.bodyParagraphs,
      personalized.closing,
      personalized.callToAction
    ].join('\n\n');

    return content;
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(personalized: CoverLetterTemplate): number {
    let score = 50; // Base score

    // Add points for personalization
    if (personalized.personalizationNotes.length > 0) score += 20;
    if (personalized.bodyParagraphs.length > 2) score += 15;
    if (this.extractKeywordsFromContent(personalized.introduction).length > 5) score += 10;
    if (this.extractKeywordsFromContent(personalized.closing).length > 3) score += 5;

    return Math.min(100, score);
  }

  /**
   * Extract skills from resume
   */
  private extractSkillsFromResume(resume: string): string[] {
    // Simple keyword extraction for skills section
    const skillsSection = resume.match(/SKILLS[:\](.*?)(?:\nEDUCATION|\nEXPERIENCE|$)/i);
    if (skillsSection) {
      const skillsText = skillsSection[1];
      return skillsText.split(/[,;]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
    }
    return [];
  }

  /**
   * Extract job title from description
   */
  private extractJobTitle(jobDescription: string): string {
    const titleMatch = jobDescription.match(/\b(?:Senior|Junior|Lead|Principal|Staff|Associate)[\s+\w+\s*\b/i);
    if (titleMatch) {
      return titleMatch[0];
    }
    return 'Position';
  }

  /**
   * Extract key points from job description
   */
  private extractKeyPoints(jobDescription: string): string[] {
    const requirements = jobDescription.toLowerCase();
    const keyPoints: string[] = [];

    // Look for specific requirements
    const requirementPatterns = [
      'years of experience',
      'specific skills',
      'certifications',
      'software knowledge',
      'industry experience',
      'management experience'
    ];

    requirementPatterns.forEach(pattern => {
      const regex = new RegExp(`(?:${pattern}[:\s]+([^.\n]*))`, 'gi');
      const matches = requirements.match(regex);
      if (matches && matches.length > 0) {
        keyPoints.push(matches[1].trim());
      }
    });

    return keyPoints;
  }

  /**
   * Generate culture-specific personalization
   */
  private generateCulturePersonalization(culture: CompanyCulture, request: CoverLetterGenerationRequest): string | null {
    if (culture.size === 'startup') {
      return 'As someone who thrives in fast-paced environments, I am excited by the innovative approach your startup is known for.';
    }

    if (culture.tone === 'casual' && request.tone === 'professional') {
      return 'Adjusting tone to be professional while maintaining authenticity.';
    }

    if (culture.values.includes('Innovation') && request.keyPoints?.includes('innovation')) {
      return 'Highlighting my experience with innovation and creative problem-solving.';
    }

    return null;
  }

  /**
   * Generate final suggestions
   */
  private generateSuggestions(personalized: CoverLetterTemplate): string[] {
    const suggestions: string[] = [];

    if (personalized.personalizationScore < 70) {
      suggestions.push('Consider adding more specific achievements or quantifiable results');
    }

    if (personalized.personalizationNotes.length === 0) {
      suggestions.push('Add company-specific personalization to strengthen your application');
    }

    suggestions.push('Proofread carefully for grammar and spelling');
    suggestions.push('Keep letter to one page for optimal readability');

    return suggestions;
  }

  // Helper methods
  private async analyzeWebsite(url: string): Promise<any> {
    try {
      // Implement web scraping for company culture analysis
      const response = await this.httpService.get(url);
      return this.extractCultureFromWebContent(response.data, '');
    } catch (error) {
      console.error(`Website analysis failed: ${error}`);
      return null;
    }
  }

  private inferCultureFromWebContent(webContent: string, jobDescription: string): Partial<CompanyCulture> {
    const tone = this.analyzeTone(webContent);
    const values = this.extractValues(webContent);
    
    return {
      tone,
      values,
      industry: this.inferIndustry(jobDescription),
      size: this.inferCompanySize(webContent)
    };
  }

  private inferCultureFromJobDescription(jobDescription: string): Partial<CompanyCulture> {
    const tone = this.analyzeTone(jobDescription);
    const industry = this.inferIndustry(jobDescription);
    
    return {
      tone,
      values: ['Professional Growth', 'Team Collaboration'],
      industry,
      size: 'medium'
    };
  }

  private mergeCultureAnalysis(primary: Partial<CompanyCulture>, secondary: Partial<CompanyCulture>): CompanyCulture {
    return {
      tone: secondary.tone || primary.tone,
      values: [...new Set([...(primary.values || []), ...(secondary.values || [])])],
      industry: secondary.industry || primary.industry,
      size: secondary.size || primary.size
    };
  }

  private adjustCultureForIndustry(culture: CompanyCulture, industry: string): CompanyCulture {
    const industryAdjustments = {
      technology: { tone: 'innovative', values: ['Innovation', 'Agility', 'Technical Excellence'] },
      healthcare: { tone: 'compassionate', values: ['Patient Care', 'Ethical Standards', 'Empathy'] },
      finance: { tone: 'analytical', values: ['Precision', 'Integrity', 'Risk Management'] }
    };

    return { ...culture, ...industryAdjustments[industry as keyof typeof industryAdjustments] };
  }

  private inferIndustry(jobDescription: string): string {
    const industryKeywords = {
      technology: ['software', 'developer', 'programming', 'api', 'cloud', 'devops'],
      healthcare: ['healthcare', 'medical', 'clinical', 'patient', 'hospital'],
      finance: ['financial', 'banking', 'investment', 'trading', 'risk'],
      marketing: ['marketing', 'advertising', 'brand', 'digital', 'social']
    };

    const text = jobDescription.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  private inferCompanySize(webContent: string): 'startup' | 'small' | 'medium' | 'large' | 'enterprise' {
    const sizeKeywords = {
      startup: ['startup', 'fast-paced', 'agile', 'innovative', 'small team'],
      small: ['small business', 'local', 'community'],
      medium: ['mid-sized', 'growing', 'established'],
      large: ['large', 'corporation', 'enterprise'],
      enterprise: ['fortune 500', 'global', 'international']
    };

    const text = webContent.toLowerCase();
    
    for (const [size, keywords] of Object.entries(sizeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return size;
      }
    }

    return 'medium';
  }

  private analyzeTone(content: string): 'professional' | 'casual' | 'enthusiastic' | 'innovative' | 'traditional' | 'startup' {
    const enthusiasticWords = ['excited', 'passionate', 'thrilled', 'enthusiastic', 'innovative'];
    const formalWords = ['professional', 'formal', 'respectfully', 'sincerely', 'regards'];
    const casualWords = ['hey', 'hi', 'guys', 'awesome', 'cool'];

    const text = content.toLowerCase();
    
    if (enthusiasticWords.some(word => text.includes(word))) {
      return 'enthusiastic';
    } else if (casualWords.some(word => text.includes(word))) {
      return 'casual';
    } else if (formalWords.some(word => text.includes(word))) {
      return 'professional';
    }

    return 'professional';
  }

  private extractValues(content: string): string[] {
    const valuePatterns = [
      'Our mission is to',
      'We believe in',
      'Our values include',
      'We are committed to',
      'We strive for',
      'Our culture emphasizes'
    ];

    const values: string[] = [];
    
    valuePatterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}([^.]*)`, 'gi');
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        values.push(matches[1].trim());
      }
    });

    return values;
  }

  private extractKeywordsFromContent(content: string): string[] {
    // Simple keyword extraction for content analysis
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/);
    
    return words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'].includes(word)
    );
  }
}