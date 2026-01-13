/**
 * AI Resume Generator Service
 * Generates job-tailored resumes using LLM abstraction and RAG system
 * Follows AIHawk patterns for parallel generation and structured prompting
 */

import { LLMAbstractionLayer } from './llm-abstraction.service';
import { RAGSystem } from './rag-system.service';

export interface ResumeGenerationRequest {
  originalResume: string;
  jobDescription: string;
  userProfile: {
    currentPosition: string;
    yearsExperience: number;
    industries: string[];
    startupExperience?: boolean;
    enterpriseExperience?: boolean;
  };
  companyInfo: {
    name: string;
    website?: string;
    industry: string;
    about?: string;
  };
  tone: 'professional' | 'modern' | 'creative';
  length: 'concise' | 'standard' | 'detailed';
  parallel: boolean; // Enable parallel section generation
  atsOptimized?: boolean; // Optimize for ATS parsing
}

export interface ResumeGenerationResult {
  content: string;
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
    [key: string]: string; // Additional sections
  };
  generationMetadata: {
    processingTime: number;
    sectionsGenerated: number;
    totalCost: number;
    modelsUsed: string[];
  };
  personalizationScore: number; // 0-100
  atsScore?: number; // ATS compatibility score
  suggestions: string[];
  template: {
    personalizationNotes: string[];
    keywordMatches: string[];
    industryAlignment: string[];
  };
}

export class AIResumeGenerator {
  constructor(
    private llmService: LLMAbstractionLayer,
    private ragSystem: RAGSystem
  ) {}

  async generateResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResult> {
    const startTime = Date.now();

    // Analyze job description using RAG system
    const jobAnalysis = await this.ragSystem.analyzeJobDescription(request.jobDescription);

    // Extract key information from original resume
    const resumeAnalysis = await this.analyzeResume(request.originalResume);

    // Generate sections in parallel or sequentially
    const sections = request.parallel
      ? await this.generateSectionsParallel(request, jobAnalysis, resumeAnalysis)
      : await this.generateSectionsSequential(request, jobAnalysis, resumeAnalysis);

    // Calculate personalization score
    const personalizationScore = this.calculatePersonalizationScore(
      sections,
      jobAnalysis,
      request.companyInfo
    );

    // Calculate ATS score if requested
    const atsScore = request.atsOptimized
      ? this.calculateATSScore(sections, jobAnalysis.keywords)
      : undefined;

    // Generate final resume content
    const content = this.compileResume(sections, request);

    // Generate suggestions for improvement
    const suggestions = this.generateSuggestions(
      sections,
      jobAnalysis,
      personalizationScore,
      atsScore
    );

    const processingTime = Date.now() - startTime;

    return {
      content,
      sections,
      generationMetadata: {
        processingTime,
        sectionsGenerated: Object.keys(sections).length,
        totalCost: 0, // Will be calculated by LLM service
        modelsUsed: ['gpt-4'], // Will be populated by LLM service
      },
      personalizationScore,
      atsScore,
      suggestions,
      template: {
        personalizationNotes: this.generatePersonalizationNotes(request, jobAnalysis),
        keywordMatches: jobAnalysis.keywords.filter((keyword) =>
          content.toLowerCase().includes(keyword.toLowerCase())
        ),
        industryAlignment: this.generateIndustryAlignment(
          request.companyInfo.industry,
          jobAnalysis
        ),
      },
    };
  }

  private async analyzeResume(resumeText: string): Promise<{
    skills: string[];
    experience: string[];
    education: string[];
    summary: string;
  }> {
    // Use LLM to analyze the original resume
    const analysisPrompt = `
Analyze this resume and extract key information:

${resumeText}

Return a JSON object with:
- skills: array of technical and soft skills
- experience: array of key achievements and responsibilities
- education: array of educational qualifications
- summary: brief professional summary

Format: JSON only, no additional text.
    `;

    const response = await this.llmService.generateText(analysisPrompt, {
      temperature: 0.1,
      maxTokens: 1000,
    });

    try {
      return JSON.parse(response.content.trim());
    } catch (error) {
      // Fallback analysis
      return {
        skills: this.extractSkillsFromText(resumeText),
        experience: this.extractExperienceFromText(resumeText),
        education: this.extractEducationFromText(resumeText),
        summary: this.extractSummaryFromText(resumeText),
      };
    }
  }

  private async generateSectionsParallel(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<Record<string, string>> {
    const sectionPromises = [
      this.generateSummarySection(request, jobAnalysis, resumeAnalysis),
      this.generateExperienceSection(request, jobAnalysis, resumeAnalysis),
      this.generateSkillsSection(request, jobAnalysis, resumeAnalysis),
      this.generateEducationSection(request, jobAnalysis, resumeAnalysis),
    ];

    const [summary, experience, skills, education] = await Promise.all(sectionPromises);

    return {
      summary,
      experience,
      skills,
      education,
    };
  }

  private async generateSectionsSequential(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<Record<string, string>> {
    const sections: Record<string, string> = {};

    sections.summary = await this.generateSummarySection(request, jobAnalysis, resumeAnalysis);
    sections.experience = await this.generateExperienceSection(
      request,
      jobAnalysis,
      resumeAnalysis
    );
    sections.skills = await this.generateSkillsSection(request, jobAnalysis, resumeAnalysis);
    sections.education = await this.generateEducationSection(request, jobAnalysis, resumeAnalysis);

    return sections;
  }

  private async generateSummarySection(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<string> {
    const prompt = `
Generate a compelling professional summary for a resume tailored to this job:

JOB REQUIREMENTS:
${jobAnalysis.requirements.join(', ')}

JOB RESPONSIBILITIES:
${jobAnalysis.responsibilities.join(', ')}

COMPANY: ${request.companyInfo.name} (${request.companyInfo.industry})
CANDIDATE PROFILE: ${request.userProfile.currentPosition} with ${request.userProfile.yearsExperience} years experience

ORIGINAL SUMMARY:
${resumeAnalysis.summary}

INSTRUCTIONS:
- Keep it 3-4 sentences
- Highlight relevant experience and skills that match the job
- Show enthusiasm for the company/industry
- Use ${request.tone} tone
- Make it ${request.length === 'concise' ? 'brief and impactful' : request.length === 'detailed' ? 'comprehensive' : 'balanced'}

Generate only the summary paragraph, no additional text.
    `;

    const response = await this.llmService.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 300,
    });

    return response.content.trim();
  }

  private async generateExperienceSection(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<string> {
    const prompt = `
Rewrite the experience section to better match this job opportunity:

JOB REQUIREMENTS:
${jobAnalysis.requirements.join(', ')}

ORIGINAL EXPERIENCE:
${resumeAnalysis.experience.join('\n')}

INSTRUCTIONS:
- Focus on achievements most relevant to the job
- Quantify impact where possible (metrics, percentages, scale)
- Use action verbs (Led, Developed, Implemented, etc.)
- Keep most relevant experiences, condense others
- Tailor language to match industry: ${request.companyInfo.industry}
- Length: ${request.length === 'concise' ? '2-3 key positions' : request.length === 'detailed' ? 'all positions with details' : '3-4 key positions'}

Format as professional experience section with job titles, companies, dates, and bullet points.
    `;

    const response = await this.llmService.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 800,
    });

    return response.content.trim();
  }

  private async generateSkillsSection(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<string> {
    const prompt = `
Optimize the skills section for this job:

JOB KEYWORDS:
${jobAnalysis.keywords.join(', ')}

ORIGINAL SKILLS:
${resumeAnalysis.skills.join(', ')}

INSTRUCTIONS:
- Prioritize skills that match job requirements
- Include both technical and soft skills relevant to the role
- Group related skills (e.g., "Programming: JavaScript, Python, React")
- Add missing skills that are mentioned in job description but candidate has equivalent experience
- Keep section ${request.length === 'concise' ? 'brief (5-7 skills)' : request.length === 'detailed' ? 'comprehensive' : 'balanced (8-12 skills)'}
- ${request.atsOptimized ? 'Optimize for ATS by using exact keyword matches where possible' : ''}

Format as a professional skills section.
    `;

    const response = await this.llmService.generateText(prompt, {
      temperature: 0.4,
      maxTokens: 500,
    });

    return response.content.trim();
  }

  private async generateEducationSection(
    request: ResumeGenerationRequest,
    jobAnalysis: any,
    resumeAnalysis: any
  ): Promise<string> {
    const prompt = `
Format the education section professionally:

ORIGINAL EDUCATION:
${resumeAnalysis.education.join('\n')}

INSTRUCTIONS:
- Include degree, institution, graduation date
- Add relevant coursework or honors if they strengthen the application
- Keep it ${request.length === 'concise' ? 'brief' : request.length === 'detailed' ? 'detailed with GPA/coursework' : 'standard'}
- Only include education relevant to the field

Format as a professional education section.
    `;

    const response = await this.llmService.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 400,
    });

    return response.content.trim();
  }

  private calculatePersonalizationScore(
    sections: Record<string, string>,
    jobAnalysis: any,
    companyInfo: any
  ): number {
    let score = 50; // Base score

    // Check keyword matches
    const content = Object.values(sections).join(' ').toLowerCase();
    const keywordMatches = jobAnalysis.keywords.filter((keyword: string) =>
      content.includes(keyword.toLowerCase())
    ).length;

    score += Math.min(keywordMatches * 5, 25); // Up to 25 points for keywords

    // Check company mentions
    if (content.includes(companyInfo.name.toLowerCase())) {
      score += 10;
    }

    // Check industry alignment
    if (content.includes(companyInfo.industry.toLowerCase())) {
      score += 5;
    }

    // Check for quantifiable achievements
    const quantifiableIndicators = ['%', '$', 'reduced', 'increased', 'improved', 'led'];
    const quantifiableCount = quantifiableIndicators.filter((indicator) =>
      content.includes(indicator)
    ).length;

    score += Math.min(quantifiableCount * 2, 10); // Up to 10 points for metrics

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateATSScore(sections: Record<string, string>, keywords: string[]): number {
    let score = 60; // Base ATS score

    const content = Object.values(sections).join(' ').toLowerCase();

    // Check exact keyword matches
    const exactMatches = keywords.filter((keyword) =>
      content.includes(keyword.toLowerCase())
    ).length;

    score += Math.min(exactMatches * 3, 25); // Up to 25 points for keywords

    // Check for standard section headers
    const standardHeaders = ['experience', 'education', 'skills', 'summary'];
    const headerMatches = standardHeaders.filter((header) => content.includes(header)).length;

    score += headerMatches * 2; // 2 points per standard header

    // Check for readable formatting
    if (content.includes('\n•') || content.includes('\n-')) {
      score += 5; // Bullet points are ATS-friendly
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private compileResume(
    sections: Record<string, string>,
    request: ResumeGenerationRequest
  ): string {
    const name = request.originalResume.split('\n')[0] || 'CANDIDATE NAME';

    return `${name}

PROFESSIONAL SUMMARY
${sections.summary}

PROFESSIONAL EXPERIENCE
${sections.experience}

SKILLS
${sections.skills}

EDUCATION
${sections.education}
    `.trim();
  }

  private generateSuggestions(
    sections: Record<string, string>,
    jobAnalysis: any,
    personalizationScore: number,
    atsScore?: number
  ): string[] {
    const suggestions: string[] = [];

    if (personalizationScore < 70) {
      suggestions.push('Add more specific examples that directly relate to the job requirements');
      suggestions.push('Include metrics and quantifiable achievements to strengthen your case');
    }

    if (atsScore && atsScore < 70) {
      suggestions.push('Ensure job titles and company names are clearly formatted');
      suggestions.push('Use standard section headers (Experience, Education, Skills)');
      suggestions.push('Include exact keywords from the job description');
    }

    const content = Object.values(sections).join(' ');
    if (content.length < 800) {
      suggestions.push('Consider adding more detail to demonstrate depth of experience');
    }

    return suggestions;
  }

  private generatePersonalizationNotes(
    request: ResumeGenerationRequest,
    jobAnalysis: any
  ): string[] {
    const notes: string[] = [];

    notes.push(
      `Tailored for ${request.companyInfo.name} in the ${request.companyInfo.industry} industry`
    );
    notes.push(`Emphasized ${jobAnalysis.requirements.slice(0, 3).join(', ')} skills`);
    notes.push(
      `Highlighted experience relevant to ${jobAnalysis.responsibilities[0] || 'key responsibilities'}`
    );

    return notes;
  }

  private generateIndustryAlignment(industry: string, jobAnalysis: any): string[] {
    const alignments: string[] = [];

    // This would be expanded with industry-specific logic
    alignments.push(`Adapted language for ${industry} industry standards`);
    alignments.push(`Emphasized ${jobAnalysis.companyCulture?.[0] || 'professional'} values`);

    return alignments;
  }

  // Fallback extraction methods
  private extractSkillsFromText(text: string): string[] {
    const skillPatterns = [
      /(?:skills?|technologies?|expertise):\s*([^.!?]+(?:[.!?][^.!?]*)*)/i,
      /(?:proficient in|experienced with|knowledge of):\s*([^.!?]+(?:[.!?][^.!?]*)*)/i,
    ];

    for (const pattern of skillPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    }

    return ['JavaScript', 'React', 'Node.js']; // Default fallback
  }

  private extractExperienceFromText(text: string): string[] {
    const lines = text.split('\n');
    const experience: string[] = [];

    for (const line of lines) {
      if (line.includes('EXPERIENCE') || line.includes('Senior') || line.includes('Engineer')) {
        experience.push(line.trim());
      }
    }

    return experience.length > 0 ? experience : ['Senior Software Engineer - Tech Corp'];
  }

  private extractEducationFromText(text: string): string[] {
    const lines = text.split('\n');
    const education: string[] = [];

    for (const line of lines) {
      if (
        line.includes('EDUCATION') ||
        line.includes('University') ||
        line.includes('BS') ||
        line.includes('MS')
      ) {
        education.push(line.trim());
      }
    }

    return education.length > 0 ? education : ['BS Computer Science - University'];
  }

  private extractSummaryFromText(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('SUMMARY') || line.length > 50) {
        return line.trim();
      }
    }

    return 'Experienced software engineer with strong technical skills and proven track record.';
  }
}
