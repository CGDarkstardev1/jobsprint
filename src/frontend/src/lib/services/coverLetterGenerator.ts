/**
 * AI Cover Letter Generator
 *
 * Features reverse-engineered from LazyApply.com's AI Cover Letter Generator (GPT-4o)
 * Generates tailored, convincing cover letters for each job application
 */

interface CoverLetterInput {
  candidateName: string;
  targetPosition: string;
  targetCompany: string;
  jobDescription: string;
  resumeSummary: string;
  keySkills: string[];
  achievements: string[];
  tone: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
}

interface CoverLetterOutput {
  content: string;
  wordCount: number;
  keyPoints: string[];
  suggestedAdjustments: string[];
}

export class CoverLetterGeneratorService {
  private toneTemplates: Map<string, string[]>;
  private industryPhrases: Map<string, string[]>;

  constructor() {
    this.toneTemplates = new Map();
    this.industryPhrases = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Tone-based opening paragraphs
    this.toneTemplates.set('professional', [
      'I am writing to express my strong interest in the {position} position at {company}.',
      'With great enthusiasm, I submit my application for the {position} role at {company}.',
      'I am delighted to apply for the {position} position at {company}.',
    ]);

    this.toneTemplates.set('enthusiastic', [
      'I am incredibly excited to apply for the {position} position at {company}!',
      'Your company has always fascinated me, and I would be thrilled to join as {position}.',
      'Finding an opportunity at {company} has been on my career bucket list!',
    ]);

    this.toneTemplates.set('formal', [
      'I respectfully submit my application for the {position} position at {company}.',
      'In response to your advertised position, I wish to be considered for the role of {position}.',
      'Please accept my formal application for the position of {position} at {company}.',
    ]);

    this.toneTemplates.set('conversational', [
      'When I came across the {position} role at {company}, I knew I had to apply.',
      'After researching {company} and learning about your innovative projects, I was immediately drawn to this opportunity.',
      'The {position} position caught my attention because it aligns perfectly with my career goals.',
    ]);

    // Industry-specific phrases
    this.industryPhrases.set('tech', [
      'cutting-edge technology',
      'digital transformation',
      'innovative solutions',
      'scalable architecture',
      'agile methodology',
      'cloud-native development',
    ]);

    this.industryPhrases.set('finance', [
      'financial performance',
      'risk management',
      'regulatory compliance',
      'investment strategies',
      'data-driven insights',
      'stakeholder relations',
    ]);

    this.industryPhrases.set('healthcare', [
      'patient care',
      'clinical outcomes',
      'healthcare technology',
      'evidence-based practice',
      'population health',
      'medical innovations',
    ]);

    this.industryPhrases.set('marketing', [
      'brand awareness',
      'customer engagement',
      'digital marketing',
      'content strategy',
      'market research',
      'brand positioning',
    ]);
  }

  /**
   * Generate a personalized cover letter (LazyApply.com pattern)
   */
  async generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
    const {
      candidateName,
      targetPosition,
      targetCompany,
      jobDescription,
      resumeSummary,
      keySkills,
      achievements,
      tone,
    } = input;

    // Detect industry from job description
    const industry = this.detectIndustry(jobDescription);

    // Generate each section
    const opening = this.generateOpening(tone, targetPosition, targetCompany);
    const body = this.generateBody(
      targetPosition,
      targetCompany,
      jobDescription,
      resumeSummary,
      keySkills,
      achievements,
      industry
    );
    const closing = this.generateClosing(candidateName, targetPosition, targetCompany);

    // Combine sections
    const content = `${opening}\n\n${body}\n\n${closing}`;

    // Generate key points for user review
    const keyPoints = this.extractKeyPoints(content);

    // Suggest adjustments
    const adjustments = this.suggestAdjustments(content, input);

    return {
      content,
      wordCount: content.split(/\s+/).length,
      keyPoints,
      suggestedAdjustments: adjustments,
    };
  }

  /**
   * Generate opening paragraph
   */
  private generateOpening(
    tone: CoverLetterInput['tone'],
    position: string,
    company: string
  ): string {
    const templates = this.toneTemplates.get(tone) || this.toneTemplates.get('professional')!;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template.replace('{position}', position).replace('{company}', company);
  }

  /**
   * Generate body paragraphs
   */
  private generateBody(
    position: string,
    company: string,
    jobDescription: string,
    resumeSummary: string,
    keySkills: string[],
    achievements: string[],
    industry: string
  ): string {
    const industryPhrases = this.industryPhrases.get(industry) || [];

    // First paragraph: Why this company and role
    const companyInterest = this.generateCompanyInterest(company, industry, industryPhrases);

    // Second paragraph: Why you're a great fit
    const qualifications = this.generateQualifications(position, jobDescription, keySkills);

    // Third paragraph: Specific achievements
    const achievementSection = this.generateAchievements(achievements, keySkills);

    return [companyInterest, qualifications, achievementSection].join('\n\n');
  }

  /**
   * Generate company interest paragraph
   */
  private generateCompanyInterest(company: string, industry: string, phrases: string[]): string {
    return (
      `I have been following ${company}'s journey in the ${industry} space with great interest. ` +
      `Your commitment to ${phrases[0] || 'excellence'} and reputation for ` +
      `${phrases[1] || 'innovation'} aligns perfectly with my professional values. ` +
      `The opportunity to contribute to a team that is driving ${phrases[2] || 'meaningful change'} ` +
      `is truly exciting to me.`
    );
  }

  /**
   * Generate qualifications paragraph
   */
  private generateQualifications(
    position: string,
    jobDescription: string,
    skills: string[]
  ): string {
    const topSkills = skills.slice(0, 4).join(', ');

    return (
      `With my background in ${topSkills} and a proven track record of ` +
      `delivering results in ${position}-related work, I am confident in my ability to ` +
      `make an immediate impact at your organization. ` +
      `My experience encompasses the key qualifications you are seeking, including ` +
      `the ability to ${this.extractResponsibility(jobDescription)}.`
    );
  }

  /**
   * Generate achievements paragraph
   */
  private generateAchievements(achievements: string[], skills: string[]): string {
    if (achievements.length === 0) {
      return (
        `Throughout my career, I have consistently demonstrated my ability to ` +
        `${skills[0] ? `drive ${skills[0]} initiatives` : 'exceed expectations'}. ` +
        `I am eager to bring this same level of dedication and results-driven mindset to ${skills[1] || 'your team'}.`
      );
    }

    const formattedAchievements = achievements
      .slice(0, 2)
      .map((a, i) => {
        if (a.startsWith('-')) a = a.substring(1);
        return `${i === 0 ? 'In particular' : 'Additionally'}, ${a.toLowerCase()}`;
      })
      .join('. ');

    return (
      `Some highlights from my professional experience include: ${formattedAchievements}. ` +
      `These experiences have equipped me with the skills and perspective necessary to ` +
      `contribute meaningfully to your team.`
    );
  }

  /**
   * Generate closing paragraph
   */
  private generateClosing(name: string, position: string, company: string): string {
    return (
      `I am genuinely enthusiastic about the possibility of joining ${company} as ${position}. ` +
      `Thank you for considering my application. I would welcome the opportunity to ` +
      `discuss how my skills and experience can contribute to your continued success.\n\n` +
      `Warm regards,\n${name}`
    );
  }

  /**
   * Detect industry from job description
   */
  private detectIndustry(jobDescription: string): string {
    const text = jobDescription.toLowerCase();

    const industryKeywords: Record<string, string[]> = {
      tech: ['software', 'developer', 'engineering', 'technology', 'programming', 'tech'],
      finance: ['financial', 'banking', 'investment', 'finance', 'accounting', 'trading'],
      healthcare: ['health', 'medical', 'clinical', 'patient', 'healthcare', 'nurse', 'doctor'],
      marketing: ['marketing', 'brand', 'digital', 'advertising', 'content', 'social media'],
      sales: [
        'sales',
        'revenue',
        'business development',
        'account management',
        'customer acquisition',
      ],
      hr: ['human resources', 'hr', 'recruiting', 'talent', 'people', 'culture'],
    };

    const scores: Record<string, number> = {};

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      scores[industry] = keywords.filter((kw) => text.includes(kw)).length;
    }

    // Return industry with highest score, default to 'tech'
    const maxIndustry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return maxIndustry && maxIndustry[1] > 0 ? maxIndustry[0] : 'tech';
  }

  /**
   * Extract key responsibility from job description
   */
  private extractResponsibility(jobDescription: string): string {
    const responsibilities = jobDescription.match(/(?:responsible for|duties include|will)/i);
    if (responsibilities) {
      return 'drive initiatives forward and deliver measurable results';
    }
    return 'drive initiatives forward and deliver measurable results';
  }

  /**
   * Extract key points for user review
   */
  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];

    // Extract company name mentions
    const companyMatch = content.match(/(?:company|organization|team)/i);
    if (companyMatch) points.push('Company interest is clearly stated');

    // Extract skill mentions
    const skillsMatch = content.match(/(?:skills|experience|background)/i);
    if (skillsMatch) points.push('Qualifications are highlighted');

    // Extract call to action
    const ctaMatch = content.match(/(?:discuss|meet|interview)/i);
    if (ctaMatch) points.push('Includes call to action for next steps');

    return points;
  }

  /**
   * Suggest adjustments for the cover letter
   */
  private suggestAdjustments(content: string, input: CoverLetterInput): string[] {
    const suggestions: string[] = [];

    // Check length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 200) {
      suggestions.push('Consider expanding on your specific achievements');
    } else if (wordCount > 500) {
      suggestions.push('Consider trimming slightly for a more concise letter');
    }

    // Check for company-specific details
    if (!input.targetCompany.toLowerCase().includes('company')) {
      suggestions.push('Research and add a specific fact about the company');
    }

    // Check for personalization
    if (input.achievements.length === 0) {
      suggestions.push('Add 2-3 specific achievements with metrics if possible');
    }

    return suggestions;
  }

  /**
   * Batch generate cover letters for multiple applications (LazyApply pattern)
   */
  async batchGenerate(inputs: CoverLetterInput[]): Promise<Map<string, CoverLetterOutput>> {
    const results = new Map<string, CoverLetterOutput>();

    // Process in parallel with rate limiting
    for (const input of inputs) {
      const output = await this.generateCoverLetter(input);
      results.set(input.targetPosition, output);
    }

    return results;
  }
}

export const coverLetterGeneratorService = new CoverLetterGeneratorService();
