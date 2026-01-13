/**
 * Enhanced AI Cover Letter Generator
 * Integrates AIHawk patterns: LLM abstraction, RAG, structured prompting, parallel generation, cost tracking
 * Combines best features from Rezi, Kickresume, and LazyApply with advanced AI capabilities
 */

import { LLMAbstractionLayer, StructuredPrompt } from './llm-abstraction.service';
import { RAGSystem, JobDescription, JobAnalysis } from './rag-system.service';

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
  jobAnalysis?: JobAnalysis;
  companyAlignment?: number;
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
  generationMetadata: {
    provider: string;
    model: string;
    totalCost: number;
    processingTime: number;
    sectionsGenerated: number;
  };
};

export type CoverLetterGenerationRequest = {
  resume: string;
  jobDescription: string;
  userProfile: any;
  jobId?: string; // For RAG integration
  companyInfo?: {
    name: string;
    website: string;
    industry: string;
    about?: string;
  };
  tone?: 'professional' | 'casual' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
  keyPoints?: string[];
  parallel?: boolean; // Enable parallel section generation
};

export class EnhancedAICoverLetterGenerator {
  private llmService: LLMAbstractionLayer;
  private ragSystem: RAGSystem;

  constructor(llmService: LLMAbstractionLayer, ragSystem: RAGSystem) {
    this.llmService = llmService;
    this.ragSystem = ragSystem;
  }

  /**
   * Enhanced cover letter generation with AIHawk patterns
   * Implements RAG, structured prompting, parallel generation, and cost tracking
   */
  async generateCoverLetter(request: CoverLetterGenerationRequest): Promise<GeneratedCoverLetter> {
    const startTime = Date.now();

    // 1. Analyze job description using RAG if jobId provided
    let jobAnalysis: JobAnalysis | undefined;
    if (request.jobId) {
      const jobDesc = await this.getJobDescriptionFromRAG();
      if (jobDesc) {
        jobAnalysis = await this.ragSystem.analyzeJobDescription(jobDesc);
      }
    }

    // 2. Analyze request and company culture
    const analysis = await this.analyzeRequest(request, jobAnalysis);

    // 3. Generate cover letter using parallel processing if enabled
    const generationResult = request.parallel
      ? await this.generateParallelCoverLetter(request, analysis)
      : await this.generateSequentialCoverLetter(request, analysis);

    const processingTime = Date.now() - startTime;

    // 4. Get usage statistics
    const usageStats = await this.llmService.getUsageStats('day');

    return {
      ...generationResult,
      generationMetadata: {
        provider: 'multiple', // Will be tracked per section
        model: 'mixed',
        totalCost: usageStats.totalCost,
        processingTime,
        sectionsGenerated: request.parallel ? 4 : 1,
      },
    };
  }

  /**
   * Parallel cover letter generation (AIHawk pattern)
   * Generates introduction, body, and closing sections in parallel
   */
  private async generateParallelCoverLetter(
    request: CoverLetterGenerationRequest,
    analysis: CoverLetterAnalysis
  ): Promise<Omit<GeneratedCoverLetter, 'generationMetadata'>> {
    // Prepare parallel prompts
    const prompts = this.buildParallelPrompts(request, analysis);

    // Generate sections in parallel
    const responses = await this.llmService.generateParallel(
      prompts.map((p) => ({
        messages: [
          { role: 'system', content: p.systemPrompt },
          { role: 'user', content: p.userPrompt },
        ],
        temperature: 0.7,
      }))
    );

    // Combine results
    const introduction = responses[0].content;
    const bodyContent = responses[1].content;
    const closing = responses[2].content;
    const callToAction = responses[3].content;

    // Parse body paragraphs
    const bodyParagraphs = this.parseBodyParagraphs(bodyContent);

    const template: CoverLetterTemplate = {
      introduction,
      bodyParagraphs,
      closing,
      callToAction,
      tone: request.tone || 'professional',
      personalizationNotes: this.generatePersonalizationNotes(analysis),
    };

    const content = this.buildCoverLetterContent(template);

    return {
      content,
      template,
      tone: template.tone,
      personalizationScore: this.calculatePersonalizationScore(template),
      companyAlignment: analysis.companyAlignment || 75,
      suggestions: this.generateSuggestions(template),
    };
  }

  /**
   * Sequential cover letter generation (fallback method)
   */
  private async generateSequentialCoverLetter(
    request: CoverLetterGenerationRequest,
    analysis: CoverLetterAnalysis
  ): Promise<Omit<GeneratedCoverLetter, 'generationMetadata'>> {
    const prompt: StructuredPrompt = {
      systemPrompt: `You are an expert cover letter writer who creates personalized, compelling cover letters that connect candidate experience with specific job requirements. Use the provided context to craft a tailored letter that demonstrates fit for the role.`,
      userPrompt: this.buildSequentialPrompt(request, analysis),
      constraints: [
        'Keep the letter to 3-4 paragraphs',
        "Use specific examples from the candidate's experience",
        'Include quantifiable achievements where possible',
        'Show enthusiasm and cultural fit',
        'End with a clear call to action',
      ],
      outputFormat: 'markdown',
    };

    const response = await this.llmService.generateStructured(prompt);

    // Parse the generated content
    const parsed = this.parseGeneratedContent(response.content);

    return {
      content: response.content,
      template: parsed.template,
      tone: parsed.tone,
      personalizationScore: parsed.personalizationScore,
      companyAlignment: analysis.companyAlignment || 75,
      suggestions: parsed.suggestions,
    };
  }

  /**
   * Analyze generation request with RAG integration
   */
  private async analyzeRequest(
    request: CoverLetterGenerationRequest,
    jobAnalysis?: JobAnalysis
  ): Promise<CoverLetterAnalysis> {
    const companyCulture = await this.analyzeCompanyCulture(
      request.companyInfo?.website,
      request.jobDescription
    );

    return {
      companyCulture,
      jobDescription: request.jobDescription,
      userSkills: this.extractSkillsFromResume(request.resume),
      userProfile: request.userProfile,
      toneMatch: this.calculateToneMatch(request.tone || 'professional', companyCulture.tone),
      personalizationLevel: 'high',
      jobAnalysis,
      companyAlignment: this.calculateCompanyAlignment(companyCulture, request),
    };
  }

  /**
   * Build parallel prompts for section-by-section generation
   */
  private buildParallelPrompts(
    request: CoverLetterGenerationRequest,
    analysis: CoverLetterAnalysis
  ) {
    const baseContext = this.buildBaseContext(request, analysis);

    return [
      // Introduction prompt
      {
        systemPrompt:
          'Write a compelling cover letter introduction that immediately captures attention and shows understanding of the role and company.',
        userPrompt: `${baseContext}\n\nWrite an introduction paragraph (3-4 sentences) that:\n1. States the position and how you found it\n2. Shows enthusiasm for the company/role\n3. Briefly mentions your most relevant qualification\n4. Hooks the reader to continue reading`,
      },
      // Body prompt
      {
        systemPrompt:
          'Write the main body paragraphs of a cover letter, focusing on relevant experience, achievements, and fit for the role.',
        userPrompt: `${baseContext}\n\nWrite 2-3 body paragraphs that:\n1. Connect your experience to the job requirements\n2. Include specific achievements with metrics where possible\n3. Demonstrate why you're the right fit\n4. Show understanding of the company's needs`,
      },
      // Closing prompt
      {
        systemPrompt:
          'Write a strong cover letter closing that reinforces your interest and calls for next steps.',
        userPrompt: `${baseContext}\n\nWrite a closing paragraph that:\n1. Reiterates your enthusiasm\n2. Summarizes why you're a great fit\n3. References next steps in the process\n4. Uses confident but professional language`,
      },
      // Call to action prompt
      {
        systemPrompt: 'Write a professional sign-off and contact information for a cover letter.',
        userPrompt: `${baseContext}\n\nWrite a professional sign-off including:\n1. Appropriate closing (Sincerely, Best regards, etc.)\n2. Your full name\n3. Contact information\n4. Any relevant links (LinkedIn, portfolio)`,
      },
    ];
  }

  /**
   * Build base context for prompts
   */
  private buildBaseContext(
    request: CoverLetterGenerationRequest,
    analysis: CoverLetterAnalysis
  ): string {
    let context = `POSITION: ${this.extractJobTitle(request.jobDescription)}\n`;
    context += `COMPANY: ${request.companyInfo?.name || 'the company'}\n`;
    context += `INDUSTRY: ${analysis.companyCulture.industry}\n`;
    context += `COMPANY CULTURE: ${analysis.companyCulture.tone} tone, values: ${analysis.companyCulture.values.join(', ')}\n\n`;

    if (analysis.jobAnalysis) {
      context += `JOB REQUIREMENTS:\n`;
      context += `- Must-have skills: ${analysis.jobAnalysis.mustHaveSkills.join(', ')}\n`;
      context += `- Key responsibilities: ${analysis.jobAnalysis.responsibilities.slice(0, 3).join('; ')}\n`;
      context += `- Career level: ${analysis.jobAnalysis.careerLevel}\n\n`;
    }

    context += `CANDIDATE PROFILE:\n`;
    context += `- Current role: ${request.userProfile.currentPosition || 'Not specified'}\n`;
    context += `- Years of experience: ${request.userProfile.yearsExperience || 'Not specified'}\n`;
    context += `- Key skills: ${analysis.userSkills.join(', ')}\n`;
    context += `- Target tone: ${request.tone || 'professional'}\n\n`;

    context += `JOB DESCRIPTION:\n${request.jobDescription}\n\n`;

    return context;
  }

  /**
   * Build sequential prompt for complete letter generation
   */
  private buildSequentialPrompt(
    request: CoverLetterGenerationRequest,
    analysis: CoverLetterAnalysis
  ): string {
    const context = this.buildBaseContext(request, analysis);

    return `${context}\n\nWrite a complete cover letter following this structure:
1. Introduction paragraph (3-4 sentences)
2. 2-3 body paragraphs highlighting relevant experience and achievements
3. Closing paragraph with call to action
4. Professional sign-off

Make it ${request.length || 'medium'} length and use a ${request.tone || 'professional'} tone.`;
  }

  /**
   * Parse body paragraphs from generated content
   */
  private parseBodyParagraphs(content: string): string[] {
    // Simple parsing - split by double newlines or numbered sections
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    return paragraphs.slice(0, 3); // Limit to 3 paragraphs
  }

  /**
   * Parse generated content into template structure
   */
  private parseGeneratedContent(content: string) {
    const lines = content.split('\n');
    let introduction = '';
    let bodyParagraphs: string[] = [];
    let closing = '';
    let callToAction = '';

    // Simple parsing logic - in production, use more sophisticated parsing
    let currentSection = 'intro';

    for (const line of lines) {
      if (line.toLowerCase().includes('dear') || line.toLowerCase().includes('introduction')) {
        currentSection = 'intro';
        if (introduction) introduction += ' ';
        introduction += line;
      } else if (
        line.toLowerCase().includes('sincerely') ||
        line.toLowerCase().includes('best regards')
      ) {
        currentSection = 'closing';
        closing = line;
      } else if (currentSection === 'intro' && introduction.length > 100) {
        currentSection = 'body';
        bodyParagraphs.push(line);
      } else if (currentSection === 'body') {
        if (bodyParagraphs.length < 3) {
          bodyParagraphs.push(line);
        } else {
          closing += line + ' ';
        }
      }
    }

    const template: CoverLetterTemplate = {
      introduction: introduction || 'Dear Hiring Manager,',
      bodyParagraphs: bodyParagraphs.filter((p) => p.trim().length > 0),
      closing: closing || 'I look forward to discussing how my skills can contribute to your team.',
      callToAction: callToAction || 'Sincerely,\n[Your Name]',
      tone: 'professional',
      personalizationNotes: [],
    };

    return {
      template,
      tone: 'professional',
      personalizationScore: this.calculatePersonalizationScore(template),
      suggestions: this.generateSuggestions(template),
    };
  }

  /**
   * Analyze company culture from website and job description
   */
  private async analyzeCompanyCulture(
    companyWebsite: string | undefined,
    jobDescription: string
  ): Promise<CompanyCulture> {
    let culture: CompanyCulture = {
      tone: 'professional',
      values: [],
      industry: '',
      size: 'medium',
    };

    try {
      // Web scraping analysis (if website provided)
      if (companyWebsite) {
        const webContent = await this.analyzeWebsite();
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
        size: 'medium',
      };
    }
  }

  private calculateToneMatch(requestTone: string, cultureTone: string): number {
    const toneCompatibility: Record<string, Record<string, number>> = {
      professional: { professional: 100, casual: 60, innovative: 80, traditional: 90, startup: 70 },
      casual: { professional: 60, casual: 100, innovative: 85, traditional: 50, startup: 95 },
      enthusiastic: { professional: 75, casual: 90, innovative: 95, traditional: 65, startup: 100 },
    };

    return toneCompatibility[requestTone]?.[cultureTone] || 75;
  }

  private calculateCompanyAlignment(
    culture: CompanyCulture,
    request: CoverLetterGenerationRequest
  ): number {
    let alignment = 50; // Base alignment

    // Company size alignment
    if (culture.size === 'startup' && request.userProfile?.startupExperience) alignment += 20;
    if (culture.size === 'enterprise' && request.userProfile?.enterpriseExperience) alignment += 15;

    // Industry experience alignment
    if (culture.industry && request.userProfile?.industries?.includes(culture.industry))
      alignment += 25;

    // Values alignment
    if (culture.values.length > 0) alignment += 10;

    return Math.min(100, alignment);
  }

  private calculatePersonalizationScore(template: CoverLetterTemplate): number {
    let score = 50; // Base score

    // Add points for personalization
    if (template.personalizationNotes.length > 0) score += 20;
    if (template.bodyParagraphs.length > 2) score += 15;
    if (this.extractKeywordsFromContent(template.introduction).length > 5) score += 10;
    if (this.extractKeywordsFromContent(template.closing).length > 3) score += 5;

    return Math.min(100, score);
  }

  private generatePersonalizationNotes(analysis: CoverLetterAnalysis): string[] {
    const notes: string[] = [];

    if (analysis.jobAnalysis) {
      notes.push(`Tailored for ${analysis.jobAnalysis.careerLevel} level position`);
      notes.push(`Incorporated ${analysis.jobAnalysis.mustHaveSkills.length} must-have skills`);
    }

    if (analysis.companyCulture.values.length > 0) {
      notes.push(
        `Aligned with company values: ${analysis.companyCulture.values.slice(0, 2).join(', ')}`
      );
    }

    return notes;
  }

  private generateSuggestions(template: CoverLetterTemplate): string[] {
    const suggestions: string[] = [];

    if (this.calculatePersonalizationScore(template) < 70) {
      suggestions.push('Consider adding more specific achievements or quantifiable results');
    }

    if (template.personalizationNotes.length === 0) {
      suggestions.push('Add company-specific personalization to strengthen your application');
    }

    suggestions.push('Proofread carefully for grammar and spelling');
    suggestions.push('Keep letter to one page for optimal readability');

    return suggestions;
  }

  // Helper methods

  private extractSkillsFromResume(resume: string): string[] {
    // Simple keyword extraction for skills section
    const skillsSection = resume.match(/SKILLS[:\]](.*?)(?:\nEDUCATION|\nEXPERIENCE|$)/i);
    if (skillsSection) {
      const skillsText = skillsSection[1];
      return skillsText
        .split(/[,;]/)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }
    return [];
  }

  private extractJobTitle(jobDescription: string): string {
    const titleMatch = jobDescription.match(
      /\b(?:Senior|Junior|Lead|Principal|Staff|Associate)[\s\w/]+\b/i
    );
    if (titleMatch) {
      return titleMatch[0];
    }
    return 'Position';
  }

  private buildCoverLetterContent(template: CoverLetterTemplate): string {
    const content = [
      template.introduction,
      ...template.bodyParagraphs,
      template.closing,
      template.callToAction,
    ].join('\n\n');

    return content;
  }

  private async analyzeWebsite(): Promise<any> {
    // TODO: Implement web scraping for company culture analysis
    return { content: '', tone: 'professional' };
  }

  private inferCultureFromWebContent(webContent: string, jobDescription: string): CompanyCulture {
    const tone = this.analyzeTone(webContent);
    const values = this.extractValues(webContent);

    return {
      tone,
      values,
      industry: this.inferIndustry(jobDescription),
      size: this.inferCompanySize(webContent),
    };
  }

  private inferCultureFromJobDescription(jobDescription: string): CompanyCulture {
    const tone = this.analyzeTone(jobDescription);
    const industry = this.inferIndustry(jobDescription);

    return {
      tone,
      values: ['Professional Growth', 'Team Collaboration'],
      industry,
      size: 'medium',
    };
  }

  private mergeCultureAnalysis(primary: CompanyCulture, secondary: CompanyCulture): CompanyCulture {
    return {
      tone: secondary.tone || primary.tone || 'professional',
      values: [...new Set([...primary.values, ...secondary.values])],
      industry: secondary.industry || primary.industry || 'general',
      size: secondary.size || primary.size || 'medium',
    };
  }

  private adjustCultureForIndustry(culture: CompanyCulture, industry: string): CompanyCulture {
    const industryAdjustments: Record<string, Partial<CompanyCulture>> = {
      technology: { tone: 'innovative', values: ['Innovation', 'Agility', 'Technical Excellence'] },
      healthcare: {
        tone: 'professional',
        values: ['Patient Care', 'Ethical Standards', 'Empathy'],
      },
      finance: { tone: 'professional', values: ['Precision', 'Integrity', 'Risk Management'] },
    };

    const adjustment = industryAdjustments[industry];
    if (adjustment) {
      return { ...culture, ...adjustment };
    }

    return culture;
  }

  private inferIndustry(jobDescription: string): string {
    const industryKeywords = {
      technology: ['software', 'developer', 'programming', 'api', 'cloud', 'devops'],
      healthcare: ['healthcare', 'medical', 'clinical', 'patient', 'hospital'],
      finance: ['financial', 'banking', 'investment', 'trading', 'risk'],
      marketing: ['marketing', 'advertising', 'brand', 'digital', 'social'],
    };

    const text = jobDescription.toLowerCase();

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  private inferCompanySize(
    webContent: string
  ): 'startup' | 'small' | 'medium' | 'large' | 'enterprise' {
    const sizeKeywords = {
      startup: ['startup', 'fast-paced', 'agile', 'innovative', 'small team'],
      small: ['small business', 'local', 'community'],
      medium: ['mid-sized', 'growing', 'established'],
      large: ['large', 'corporation', 'enterprise'],
      enterprise: ['fortune 500', 'global', 'international'],
    };

    const text = webContent.toLowerCase();

    for (const [size, keywords] of Object.entries(sizeKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return size as 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
      }
    }

    return 'medium';
  }

  private analyzeTone(
    content: string
  ): 'professional' | 'casual' | 'innovative' | 'traditional' | 'startup' {
    const enthusiasticWords = ['excited', 'passionate', 'thrilled', 'enthusiastic', 'innovative'];
    const formalWords = ['professional', 'formal', 'respectfully', 'sincerely', 'regards'];
    const casualWords = ['hey', 'hi', 'guys', 'awesome', 'cool'];

    const text = content.toLowerCase();

    if (enthusiasticWords.some((word) => text.includes(word))) {
      return 'innovative';
    } else if (casualWords.some((word) => text.includes(word))) {
      return 'casual';
    } else if (formalWords.some((word) => text.includes(word))) {
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
      'Our culture emphasizes',
    ];

    const values: string[] = [];

    valuePatterns.forEach((pattern) => {
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
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'].includes(word)
      );

    return words;
  }

  private async getJobDescriptionFromRAG(): Promise<JobDescription | null> {
    // This would integrate with the RAG system to retrieve job descriptions
    // For now, return null - would be implemented with actual RAG integration
    return null;
  }
}
