import Anthropic from '@anthropic-ai/sdk';
import { AgentService } from './agent.js';
import { activepiecesService } from './activepieces.js';
import { jobScraperService } from './jobScraper.js';
import fs from 'fs/promises';
import path from 'path';

export class AutoApplyService {
  constructor(config = {}) {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY
    });
    this.agentService = new AgentService(config);
    this.model = 'claude-sonnet-4-5-20250929';
    this.submissionsLog = [];
    this.platforms = {
      linkedin: {
        name: 'LinkedIn',
        baseUrl: 'https://www.linkedin.com/jobs',
        searchPath: '/search'
      },
      indeed: {
        name: 'Indeed',
        baseUrl: 'https://www.indeed.com',
        searchPath: '/jobs'
      },
      glassdoor: {
        name: 'Glassdoor',
        baseUrl: 'https://www.glassdoor.com',
        searchPath: '/Job'
      },
      angelList: {
        name: 'AngelList',
        baseUrl: 'https://wellfound.com',
        searchPath: '/jobs'
      },
      otta: {
        name: 'Otta',
        baseUrl: 'https://otta.com',
        searchPath: '/jobs'
      },
      remoteok: {
        name: 'RemoteOK',
        baseUrl: 'https://remoteok.com',
        searchPath: '/remote-ai-jobs'
      }
    };
  }

  /**
   * Search for jobs across specified platforms
   * @param {Object} query - Search criteria
   * @param {string} query.keywords - Job keywords (e.g., "software engineer")
   * @param {string} query.location - Location (e.g., "San Francisco, CA" or "remote")
   * @param {string} query.experienceLevel - Experience level (entry, mid, senior, executive)
   * @param {string} query.jobType - Job type (full-time, part-time, contract, internship)
   * @param {Array<string>} platforms - Platform names to search (linkedin, indeed, glassdoor)
   * @returns {Promise<Array<Object>>} - List of job listings
   */
  async searchJobs(query, platforms = ['linkedin', 'indeed']) {
    let allJobs = [];

    // Try real job scraper first for all platforms in parallel
    try {
      logger.info(`Searching all platforms in parallel: ${platforms.join(', ')}`);
      
      const result = await jobScraperService.scrapeAllPlatforms(
        query.keywords || 'AI Engineer',
        query.location || 'Remote',
        true // remoteOnly
      );
      
      if (result.success && result.jobs.length > 0) {
        // Filter to only requested platforms
        allJobs = result.jobs.filter(job => platforms.includes(job.platform));
        logger.info(`Real scraper found ${allJobs.length} jobs from ${[...new Set(allJobs.map(j => j.platform))].join(', ')}`);
      }
    } catch (error) {
      logger.warn(`Parallel scraping failed: ${error.message}, falling back to platform-by-platform`);
    }

    // Fallback: Search each platform individually if parallel failed or returned no results
    if (allJobs.length === 0) {
      logger.info('Falling back to individual platform searches...');
      
      const searchPromises = platforms.map(async (platform) => {
        if (!this.platforms[platform]) {
          console.warn(`Unknown platform: ${platform}`);
          return [];
        }

        try {
          // Use Activepieces for high-volume platforms if configured
          if (['linkedin', 'indeed', 'glassdoor'].includes(platform) && process.env.ACTIVEPIECES_MCP_TOKEN) {
            const apResult = await activepiecesService.triggerJobSearch({ ...query, platform });
            if (apResult?.success && apResult.jobs) {
              return apResult.jobs;
            }
          }

          // Use the real scraper
          return await this._searchPlatform(platform, query);
        } catch (error) {
          console.error(`Error searching ${platform}:`, error.message);
          return [];
        }
      });

      const platformResults = await Promise.all(searchPromises);
      platformResults.forEach(platformJobs => allJobs.push(...platformJobs));
    }

    // Deduplicate and sort by relevance
    const uniqueJobs = this._deduplicateJobs(allJobs);
    
    // ENFORCE REMOTE ONLY: Double check results
    const remoteOnly = uniqueJobs.filter(job => 
      (job.location || '').toLowerCase().includes('remote') || 
      (job.description || '').toLowerCase().includes('remote') ||
      (job.tags || []).some(tag => tag.toLowerCase().includes('remote'))
    );

    return this._sortJobsByRelevance(remoteOnly, query);
  }

  /**
   * Tailor CV to match specific job description using Claude Sonnet 4.5
   * @param {Object} jobDescription - Job description object
   * @param {string} jobDescription.title - Job title
   * @param {string} jobDescription.company - Company name
   * @param {string} jobDescription.description - Full job description
   * @param {Object} userCV - User's CV object or markdown string
   * @returns {Promise<string>} - Tailored CV as markdown
   */
  async tailorCV(jobDescription, userCV) {
    const cvContent = typeof userCV === 'string'
      ? userCV
      : this._convertCVToMarkdown(userCV);

    const prompt = this._buildTailoringPrompt(jobDescription, cvContent);

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const tailoredCV = message.content[0].text;

      // Extract reasoning if using extended thinking
      const reasoning = message.content.find(block => block.type === 'thinking');

      return {
        tailoredCV,
        reasoning: reasoning?.thinking || '',
        metadata: {
          jobTitle: jobDescription.title,
          company: jobDescription.company,
          tailoredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error tailoring CV:', error);
      throw new Error('Failed to tailor CV with AI');
    }
  }

  /**
   * Generate personalized cover letter using Claude Sonnet 4.5
   * @param {Object} jobDescription - Job description object
   * @param {Object} userCV - User's CV object or markdown string
   * @param {Object} options - Additional options
   * @param {string} options.tone - Tone of cover letter (professional, enthusiastic, confident)
   * @param {number} options.length - Approximate word count (300, 400, 500)
   * @returns {Promise<string>} - Generated cover letter
   */
  async generateCoverLetter(jobDescription, userCV, options = {}) {
    const cvContent = typeof userCV === 'string'
      ? userCV
      : this._convertCVToMarkdown(userCV);

    const prompt = this._buildCoverLetterPrompt(jobDescription, cvContent, options);

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const coverLetter = message.content[0].text;

      return {
        coverLetter,
        metadata: {
          jobTitle: jobDescription.title,
          company: jobDescription.company,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw new Error('Failed to generate cover letter with AI');
    }
  }

  /**
   * Submit application using agentic loop to navigate platform forms
   * @param {string} jobUrl - URL to job application
   * @param {string} tailoredCV - Tailored CV markdown
   * @param {string} coverLetter - Cover letter text
   * @param {Object} formData - Additional form data (email, phone, etc.)
   * @returns {Promise<Object>} - Submission result
   */
  async submitApplication(jobUrl, tailoredCV, coverLetter, formData = {}) {
    const submissionId = `sub_${Date.now()}`;

    try {
      // Use agent service to navigate and submit
      const result = await this.agentService.executeTask({
        type: 'job_application',
        targetUrl: jobUrl,
        cv: tailoredCV,
        coverLetter: coverLetter,
        formData: formData,
        submissionId: submissionId
      });

      // Log submission
      await this.logSubmission({
        submissionId,
        jobUrl,
        status: result.success ? 'submitted' : 'failed',
        timestamp: new Date().toISOString(),
        result
      });

      return {
        success: result.success,
        submissionId,
        details: result
      };
    } catch (error) {
      console.error('Error submitting application:', error);

      await this.logSubmission({
        submissionId,
        jobUrl,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });

      return {
        success: false,
        submissionId,
        error: error.message
      };
    }
  }

  /**
   * Log submission to tracking system
   * @param {Object} submissionData - Submission details
   * @returns {Promise<void>}
   */
  async logSubmission(submissionData) {
    this.submissionsLog.push(submissionData);

    // Persist to file
    const logPath = path.join(process.cwd(), 'data', 'submissions.json');

    try {
      await fs.mkdir(path.dirname(logPath), { recursive: true });

      let existingLogs = [];
      try {
        const data = await fs.readFile(logPath, 'utf8');
        existingLogs = JSON.parse(data);
      } catch (err) {
        // File doesn't exist yet, start fresh
      }

      existingLogs.push(submissionData);
      await fs.writeFile(logPath, JSON.stringify(existingLogs, null, 2));
    } catch (error) {
      console.error('Error saving submission log:', error);
    }
  }

  /**
   * Get submission history
   * @param {Object} filters - Filter criteria
   * @returns {Array<Object>} - Filtered submissions
   */
  getSubmissionHistory(filters = {}) {
    let logs = [...this.submissionsLog];

    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }

    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Search specific platform for jobs
   * @private
   */
  async _searchPlatform(platform, query) {
    // Use the real job scraper service for actual scraping
    try {
      const result = await jobScraperService.scrapePlatform(
        platform,
        query.keywords || '',
        query.location || 'Remote',
        true // remoteOnly
      );
      
      if (result.success) {
        return result.jobs;
      }
      
      logger.warn(`Scraping ${platform} failed, falling back to agent-based search`);
      
      // Fallback to agent service if scraper fails
      const platformConfig = this.platforms[platform];
      const searchUrl = `${platformConfig.baseUrl}${platformConfig.searchPath}?q=${encodeURIComponent(query.keywords || '')}&l=${encodeURIComponent(query.location || '')}`;
      
      const agentResult = await this.agentService.executeTask({
        type: 'job_search',
        platform: platform,
        url: searchUrl,
        query: query
      });
      
      return agentResult.jobs || [];
      
    } catch (error) {
      logger.error(`Error searching ${platform}:`, error.message);
      return [];
    }
  }

  /**
   * Build CV tailoring prompt for Claude
   * @private
   */
  _buildTailoringPrompt(jobDescription, cvContent) {
    return `You are an expert career coach and professional CV writer. Your task is to rewrite this CV to perfectly align with the job description below.

JOB DETAILS:
- Title: ${jobDescription.title}
- Company: ${jobDescription.company}
- Description:
${jobDescription.description}

CURRENT CV:
${cvContent}

INSTRUCTIONS:
1. Analyze the job description to identify key requirements, skills, and keywords
2. Rewrite the CV to highlight relevant experience and skills that match the JD
3. Incorporate keywords from the job description naturally throughout the CV
4. Maintain perfect cohesion and professional tone
5. Ensure all content is truthful - do not invent experience or skills
6. Optimize for ATS (Applicant Tracking System) compatibility
7. Structure the improved CV as clean markdown

Return ONLY the improved CV as markdown, with no additional commentary.`;
  }

  /**
   * Build cover letter generation prompt for Claude
   * @private
   */
  _buildCoverLetterPrompt(jobDescription, cvContent, options) {
    const tone = options.tone || 'professional';
    const length = options.length || 400;

    return `You are an expert career coach. Write a compelling cover letter for this job application based on the provided CV.

JOB DETAILS:
- Title: ${jobDescription.title}
- Company: ${jobDescription.company}
- Description:
${jobDescription.description}

APPLICANT CV:
${cvContent}

REQUIREMENTS:
- Tone: ${tone}
- Length: Approximately ${length} words
- Content: Highlight relevant experience, express genuine interest, and show alignment with company values
- Format: Professional business letter format

Write a compelling cover letter that connects the applicant's experience to the job requirements. Return only the cover letter with no additional commentary.`;
  }

  /**
   * Convert CV object to markdown format
   * @private
   */
  _convertCVToMarkdown(cv) {
    if (typeof cv === 'string') return cv;

    let markdown = `# ${cv.name || 'CV'}\n\n`;

    if (cv.contact) {
      markdown += `${cv.contact.email || ''} | ${cv.contact.phone || ''} | ${cv.contact.location || ''}\n\n`;
    }

    if (cv.summary) {
      markdown += `## Professional Summary\n${cv.summary}\n\n`;
    }

    if (cv.experience) {
      markdown += `## Experience\n`;
      cv.experience.forEach(exp => {
        markdown += `### ${exp.title} at ${exp.company}\n`;
        markdown += `*${exp.startDate} - ${exp.endDate}*\n\n`;
        markdown += `${exp.description}\n\n`;
      });
    }

    if (cv.education) {
      markdown += `## Education\n`;
      cv.education.forEach(edu => {
        markdown += `### ${edu.degree}\n`;
        markdown += `${edu.institution}, ${edu.year}\n\n`;
      });
    }

    if (cv.skills) {
      markdown += `## Skills\n${cv.skills.join(', ')}\n\n`;
    }

    return markdown;
  }

  /**
   * Remove duplicate job listings
   * @private
   */
  _deduplicateJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.company}-${job.title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort jobs by relevance to query
   * @private
   */
  _sortJobsByRelevance(jobs, query) {
    const keywords = (query.keywords || '').toLowerCase().split(' ');

    return jobs.sort((a, b) => {
      const scoreA = this._calculateRelevanceScore(a, keywords);
      const scoreB = this._calculateRelevanceScore(b, keywords);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score for job
   * @private
   */
  _calculateRelevanceScore(job, keywords) {
    let score = 0;
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();

    keywords.forEach(keyword => {
      if (title.includes(keyword)) score += 10;
      if (description.includes(keyword)) score += 5;
    });

    return score;
  }
}


