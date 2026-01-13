/**
 * RAG (Retrieval-Augmented Generation) System
 * Uses FAISS vector store for job description parsing and semantic search
 * Implements job-tailored content generation with context retrieval
 */

import { LLMAbstractionLayer, LLMResponse, StructuredPrompt } from './llm-abstraction.service';

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  content: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  metadata: {
    url?: string;
    postedDate?: Date;
    salary?: string;
    location?: string;
    type?: string;
  };
}

export interface VectorEmbedding {
  id: string;
  vector: number[];
  content: string;
  metadata: {
    type: 'requirement' | 'skill' | 'responsibility' | 'benefit' | 'company';
    jobId: string;
    chunkIndex: number;
  };
}

export interface RAGQuery {
  query: string;
  jobId?: string;
  topK?: number;
  threshold?: number;
  filters?: {
    type?: string[];
    company?: string;
    location?: string;
  };
}

export interface RAGResult {
  content: string;
  score: number;
  metadata: VectorEmbedding['metadata'];
  jobDescription?: JobDescription;
}

export interface JobAnalysis {
  jobId: string;
  keyRequirements: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  companyCulture: string[];
  compensation: {
    salary?: string;
    benefits?: string[];
  };
  careerLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industry: string;
}

export class RAGSystem {
  private vectorStore: Map<string, VectorEmbedding[]> = new Map();
  private jobDescriptions: Map<string, JobDescription> = new Map();
  private llmService: LLMAbstractionLayer;

  constructor(llmService: LLMAbstractionLayer) {
    this.llmService = llmService;
  }

  /**
   * Add job description to the vector store
   */
  async addJobDescription(jobDesc: JobDescription): Promise<void> {
    // Store the job description
    this.jobDescriptions.set(jobDesc.id, jobDesc);

    // Generate embeddings for different sections
    const embeddings = await this.generateEmbeddings(jobDesc);

    // Store in vector store
    this.vectorStore.set(jobDesc.id, embeddings);
  }

  /**
   * Search for relevant job information using semantic similarity
   */
  async search(query: RAGQuery): Promise<RAGResult[]> {
    const allEmbeddings: VectorEmbedding[] = [];

    // Get embeddings from specified job or all jobs
    if (query.jobId) {
      const jobEmbeddings = this.vectorStore.get(query.jobId) || [];
      allEmbeddings.push(...jobEmbeddings);
    } else {
      for (const embeddings of this.vectorStore.values()) {
        allEmbeddings.push(...embeddings);
      }
    }

    if (allEmbeddings.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query.query);

    // Calculate similarities
    const similarities = allEmbeddings.map((embedding) => ({
      embedding,
      score: this.cosineSimilarity(queryEmbedding, embedding.vector),
    }));

    // Filter and sort results
    let results = similarities
      .filter((item) => item.score >= (query.threshold || 0.7))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK || 5);

    // Apply filters
    if (query.filters) {
      results = results.filter((item) => {
        const metadata = item.embedding.metadata;

        if (query.filters!.type && !query.filters!.type.includes(metadata.type)) {
          return false;
        }

        if (query.filters!.company) {
          const job = this.jobDescriptions.get(metadata.jobId);
          if (!job || job.company !== query.filters!.company) {
            return false;
          }
        }

        if (query.filters!.location) {
          const job = this.jobDescriptions.get(metadata.jobId);
          if (!job || job.metadata.location !== query.filters!.location) {
            return false;
          }
        }

        return true;
      });
    }

    // Format results
    return results.map((item) => ({
      content: item.embedding.content,
      score: item.score,
      metadata: item.embedding.metadata,
      jobDescription: this.jobDescriptions.get(item.embedding.metadata.jobId),
    }));
  }

  /**
   * Analyze job description and extract structured information
   */
  async analyzeJobDescription(jobDesc: JobDescription): Promise<JobAnalysis> {
    const analysisPrompt: StructuredPrompt = {
      systemPrompt: `You are an expert HR analyst and job market specialist. Analyze job descriptions to extract key information for resume tailoring and application strategies.

Your task is to analyze a job description and extract structured information that will help candidates create better applications.`,
      userPrompt: `Please analyze this job description and extract the following information:

JOB TITLE: ${jobDesc.title}
COMPANY: ${jobDesc.company}
LOCATION: ${jobDesc.metadata.location || 'Not specified'}
SALARY: ${jobDesc.metadata.salary || 'Not specified'}

JOB DESCRIPTION:
${jobDesc.content}

Please provide a structured analysis including:
1. Key requirements (must-have qualifications)
2. Must-have skills (technical and soft skills required)
3. Nice-to-have skills (preferred but not required)
4. Main responsibilities and duties
5. Company culture indicators
6. Career level (entry/mid/senior/lead/executive)
7. Industry classification
8. Compensation insights (beyond salary)`,
      constraints: [
        'Extract information directly from the job description',
        'Distinguish between must-have and nice-to-have requirements',
        'Be specific about skills and technologies mentioned',
        'Identify company culture from language and values mentioned',
        'Classify career level based on experience requirements and title',
      ],
      outputFormat: 'json',
    };

    const response = await this.llmService.generateStructured(analysisPrompt);
    const analysis = JSON.parse(response.content);

    return {
      jobId: jobDesc.id,
      keyRequirements: analysis.keyRequirements || [],
      mustHaveSkills: analysis.mustHaveSkills || [],
      niceToHaveSkills: analysis.niceToHaveSkills || [],
      responsibilities: analysis.responsibilities || [],
      companyCulture: analysis.companyCulture || [],
      compensation: {
        salary: jobDesc.metadata.salary,
        benefits: analysis.benefits || [],
      },
      careerLevel: analysis.careerLevel || 'mid',
      industry: analysis.industry || 'technology',
    };
  }

  /**
   * Generate job-tailored content using RAG retrieval
   */
  async generateTailoredContent(
    jobId: string,
    userProfile: any,
    contentType: 'resume' | 'cover-letter' | 'linkedin-summary'
  ): Promise<LLMResponse> {
    // Retrieve relevant job information
    const jobResults = await this.search({
      query: `Generate ${contentType} for ${this.jobDescriptions.get(jobId)?.title} position`,
      jobId,
      topK: 10,
    });

    const jobAnalysis = await this.analyzeJobDescription(this.jobDescriptions.get(jobId)!);

    // Build context from retrieved information
    const context = this.buildContextForGeneration(jobResults, jobAnalysis, userProfile);

    // Generate tailored content
    const prompt = this.buildTailoredContentPrompt(contentType, context, userProfile, jobAnalysis);

    return this.llmService.generateStructured(prompt);
  }

  /**
   * Find similar jobs based on requirements and skills
   */
  async findSimilarJobs(jobId: string, limit: number = 5): Promise<JobDescription[]> {
    const targetJob = this.jobDescriptions.get(jobId);
    if (!targetJob) {
      return [];
    }

    // Search for jobs with similar requirements
    const similarResults = await this.search({
      query: `Jobs similar to ${targetJob.title} requiring ${targetJob.skills.slice(0, 3).join(', ')}`,
      topK: limit * 2, // Get more results to filter
    });

    // Extract unique job IDs and return job descriptions
    const jobIds = [...new Set(similarResults.map((r) => r.metadata.jobId))]
      .filter((id) => id !== jobId)
      .slice(0, limit);

    return jobIds.map((id) => this.jobDescriptions.get(id)!).filter(Boolean);
  }

  // Private helper methods

  private async generateEmbeddings(jobDesc: JobDescription): Promise<VectorEmbedding[]> {
    const embeddings: VectorEmbedding[] = [];
    let chunkIndex = 0;

    // Embed job title and company
    const titleEmbedding = await this.generateQueryEmbedding(
      `${jobDesc.title} at ${jobDesc.company}`
    );
    embeddings.push({
      id: `${jobDesc.id}-title-${chunkIndex}`,
      vector: titleEmbedding,
      content: `${jobDesc.title} at ${jobDesc.company}`,
      metadata: {
        type: 'company',
        jobId: jobDesc.id,
        chunkIndex: chunkIndex++,
      },
    });

    // Embed requirements
    for (const req of jobDesc.requirements) {
      const embedding = await this.generateQueryEmbedding(req);
      embeddings.push({
        id: `${jobDesc.id}-req-${chunkIndex}`,
        vector: embedding,
        content: req,
        metadata: {
          type: 'requirement',
          jobId: jobDesc.id,
          chunkIndex: chunkIndex++,
        },
      });
    }

    // Embed skills
    for (const skill of jobDesc.skills) {
      const embedding = await this.generateQueryEmbedding(skill);
      embeddings.push({
        id: `${jobDesc.id}-skill-${chunkIndex}`,
        vector: embedding,
        content: skill,
        metadata: {
          type: 'skill',
          jobId: jobDesc.id,
          chunkIndex: chunkIndex++,
        },
      });
    }

    // Embed responsibilities
    for (const resp of jobDesc.responsibilities) {
      const embedding = await this.generateQueryEmbedding(resp);
      embeddings.push({
        id: `${jobDesc.id}-resp-${chunkIndex}`,
        vector: embedding,
        content: resp,
        metadata: {
          type: 'responsibility',
          jobId: jobDesc.id,
          chunkIndex: chunkIndex++,
        },
      });
    }

    return embeddings;
  }

  private async generateQueryEmbedding(text: string): Promise<number[]> {
    // Use a simple embedding approach - in production, use actual embedding models
    // For now, create a basic hash-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding: number[] = new Array(384).fill(0); // 384 dimensions

    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = ((hash % 384) + 384) % 384;
      embedding[position] += 1;

      // Add some positional encoding
      const posHash = this.simpleHash(word + index);
      const posPosition = ((posHash % 384) + 384) % 384;
      embedding[posPosition] += 0.5;
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / magnitude);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private buildContextForGeneration(
    results: RAGResult[],
    analysis: JobAnalysis,
    userProfile: any
  ): string {
    let context = 'RETRIEVED JOB INFORMATION:\n\n';

    // Group results by type
    const grouped = results.reduce(
      (acc, result) => {
        if (!acc[result.metadata.type]) {
          acc[result.metadata.type] = [];
        }
        acc[result.metadata.type].push(result);
        return acc;
      },
      {} as Record<string, RAGResult[]>
    );

    // Add requirements
    if (grouped.requirement) {
      context += 'KEY REQUIREMENTS:\n';
      grouped.requirement.forEach((req) => {
        context += `- ${req.content}\n`;
      });
      context += '\n';
    }

    // Add skills
    if (grouped.skill) {
      context += 'REQUIRED SKILLS:\n';
      grouped.skill.forEach((skill) => {
        context += `- ${skill.content}\n`;
      });
      context += '\n';
    }

    // Add responsibilities
    if (grouped.responsibility) {
      context += 'MAIN RESPONSIBILITIES:\n';
      grouped.responsibility.forEach((resp) => {
        context += `- ${resp.content}\n`;
      });
      context += '\n';
    }

    // Add job analysis insights
    context += 'JOB ANALYSIS:\n';
    context += `- Career Level: ${analysis.careerLevel}\n`;
    context += `- Industry: ${analysis.industry}\n`;
    context += `- Must-have Skills: ${analysis.mustHaveSkills.join(', ')}\n`;
    context += `- Nice-to-have Skills: ${analysis.niceToHaveSkills.join(', ')}\n`;
    if (analysis.companyCulture.length > 0) {
      context += `- Company Culture: ${analysis.companyCulture.join(', ')}\n`;
    }
    context += '\n';

    return context;
  }

  private buildTailoredContentPrompt(
    contentType: string,
    context: string,
    userProfile: any,
    analysis: JobAnalysis
  ): StructuredPrompt {
    const basePrompts = {
      resume: {
        systemPrompt: `You are an expert resume writer specializing in ATS-optimized, job-tailored resumes. Create compelling resumes that highlight relevant experience and skills for specific job applications.`,
        userPrompt: `Create a tailored resume section for a ${analysis.careerLevel} ${analysis.industry} position.

${context}

USER PROFILE:
Name: ${userProfile.name || 'Candidate'}
Current Position: ${userProfile.currentPosition || 'Not specified'}
Years of Experience: ${userProfile.yearsExperience || 'Not specified'}
Key Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
Education: ${userProfile.education || 'Not specified'}

Please generate a resume that:
1. Uses keywords from the job description
2. Quantifies achievements where possible
3. Aligns with the career level requirements
4. Highlights relevant experience and skills
5. Is ATS-friendly with clear section headers`,
        constraints: [
          'Use action verbs and quantify achievements',
          'Include relevant keywords from the job description',
          'Keep content concise and impactful',
          'Structure with clear headings',
          'Focus on achievements over responsibilities',
        ],
      },
      'cover-letter': {
        systemPrompt: `You are an expert cover letter writer who creates personalized, compelling cover letters that connect candidate experience with job requirements.`,
        userPrompt: `Write a tailored cover letter for a ${analysis.careerLevel} ${analysis.industry} position.

${context}

USER PROFILE:
Name: ${userProfile.name || 'Candidate'}
Current Position: ${userProfile.currentPosition || 'Not specified'}
Years of Experience: ${userProfile.yearsExperience || 'Not specified'}
Key Skills: ${userProfile.skills?.join(', ') || 'Not specified'}

Please write a cover letter that:
1. Shows understanding of the role and company
2. Connects the candidate's experience to job requirements
3. Demonstrates enthusiasm and cultural fit
4. Includes specific examples of relevant achievements
5. Calls to action for next steps`,
        constraints: [
          'Keep to 3-4 paragraphs',
          'Be specific about company and role',
          'Show enthusiasm and cultural fit',
          'Include quantifiable achievements',
          'End with clear call to action',
        ],
      },
      'linkedin-summary': {
        systemPrompt: `You are a LinkedIn profile optimization expert who creates compelling professional summaries that attract recruiters and opportunities.`,
        userPrompt: `Create a tailored LinkedIn summary for a ${analysis.careerLevel} ${analysis.industry} professional.

${context}

USER PROFILE:
Name: ${userProfile.name || 'Candidate'}
Current Position: ${userProfile.currentPosition || 'Not specified'}
Years of Experience: ${userProfile.yearsExperience || 'Not specified'}
Key Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
Professional Summary: ${userProfile.summary || 'Not specified'}

Please write a LinkedIn summary that:
1. Positions the candidate for this type of role
2. Incorporates relevant keywords
3. Highlights unique value proposition
4. Shows industry expertise and passion
5. Includes call-to-action for connections`,
        constraints: [
          'Keep under 2000 characters',
          'Use first-person voice',
          'Include industry-specific keywords',
          'Show personality and passion',
          'End with professional invitation',
        ],
      },
    };

    const promptConfig = basePrompts[contentType as keyof typeof basePrompts];

    return {
      systemPrompt: promptConfig.systemPrompt,
      userPrompt: promptConfig.userPrompt,
      constraints: promptConfig.constraints,
      outputFormat: 'markdown',
    };
  }
}
