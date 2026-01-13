import { logger } from '../utils/logger.js';
import puter from '../utils/ai-client.js';
import { atsChecker } from '../utils/ats-checker.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Resume Service - Advanced AI-powered resume tailoring
 *
 * POWER USER FEATURES:
 * 1. Dynamic Summary Rewriting: Custom summary for EACH application
 * 2. Skills Keyword Matching: Prioritizes skills based on JD requirements
 * 3. Experience Relevance: Highlights most relevant experience first
 * 4. ATS Optimization: Optimized for Applicant Tracking Systems
 * 5. Caching: Stores tailoring results for performance
 *
 * Uses Claude Sonnet 4.5 via Puter.js for intelligent customization.
 */
export class ResumeService {
    constructor() {
        this.puter = puter;
        this.resumeDir = path.join(process.cwd(), 'src/data/resumes');
        this.initialized = false;

        // POWER USER: Cache for tailoring results
        this.tailoringCache = new Map();
        this.maxCacheSize = 100;
    }

    /**
     * Initialize the service
     */
    async init() {
        await fs.mkdir(this.resumeDir, { recursive: true });
        this.initialized = true;
        logger.info('ResumeService initialized');
    }

    /**
     * Load a base resume from file
     * @param {string} resumePath - Path to resume JSON file
     * @returns {Promise<Object>} - Resume object
     */
    async loadResume(resumePath) {
        try {
            const fullPath = path.resolve(resumePath);
            const data = await fs.readFile(fullPath, 'utf8');
            const resume = JSON.parse(data);
            logger.info(`Loaded resume from ${resumePath}`);
            return resume;
        } catch (error) {
            logger.error(`Failed to load resume from ${resumePath}:`, error);
            throw new Error(`Resume load failed: ${error.message}`);
        }
    }

    /**
     * Save a tailored resume
     * @param {Object} resume - Resume object to save
     * @param {string} filename - Output filename
     */
    async saveResume(resume, filename) {
        if (!this.initialized) {
            await this.init();
        }

        const outputPath = path.join(this.resumeDir, filename);
        await fs.writeFile(outputPath, JSON.stringify(resume, null, 2), 'utf8');
        logger.info(`Saved resume to ${outputPath}`);
        return outputPath;
    }

    /**
     * POWER USER: Dynamic Summary Rewriting
     *
     * Creates a UNIQUE professional summary for each job application:
     * - Analyzes job description requirements
     * - Identifies key skills and experience needed
     * - Rewrites summary to highlight relevant qualifications
     * - Incorporates JD keywords naturally
     * - Maintains authenticity (no invented experience)
     * - Optimizes for ATS systems
     *
     * @param {Object} resume - Base resume object
     * @param {Object} job - Job object with title, description, requirements
     * @param {Object} options - Tailoring options
     * @returns {Promise<Object>} - Tailored resume with updated summary
     */
    async tailorSummary(resume, job, options = {}) {
        const { tone = 'professional', keywords = [] } = options;

        logger.info(`POWER USER: Tailoring summary for ${job.title} at ${job.company || 'Unknown'}`);

        // Extract key requirements from job description
        const jobKeywords = this._extractKeywordsFromJD(job);
        const allKeywords = [...keywords, ...jobKeywords];

        const prompt = `You are an expert resume writer. Rewrite the professional summary to PERFECTLY align with this job application.

CURRENT SUMMARY:
${resume.summary || 'No summary provided'}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company || 'Unknown'}
- Location: ${job.location || 'Not specified'}

FULL JOB DESCRIPTION:
${job.description || 'No description provided'}

KEY REQUIREMENTS IDENTIFIED:
${allKeywords.length > 0 ? allKeywords.join(', ') : 'See job description above'}

APPLICANT CONTEXT:
- Name: ${resume.name || 'Applicant'}
- Current Role: ${resume.currentRole || 'Not specified'}
- Years Experience: ${resume.yearsExperience || 'Not specified'}
- Top Skills: ${Array.isArray(resume.skills) ? resume.skills.slice(0, 5).join(', ') : 'Not specified'}

POWER USER INSTRUCTIONS:
1. Create a UNIQUE summary for THIS specific job
2. Keep it concise (2-3 sentences maximum)
3. Start with a strong value proposition tailored to the role
4. Highlight ONLY relevant experience and skills from the applicant's background
5. Incorporate 3-5 keywords from the job description naturally
6. Use a ${tone} professional tone
7. Focus on measurable achievements when possible
8. Maintain 100% authenticity - DO NOT invent qualifications
9. Make it ATS-optimized with proper keyword density
10. Show clear alignment between applicant's background and job requirements

EXAMPLE FORMAT:
"Results-driven [Current Role] with [X] years of experience in [Key Skill 1] and [Key Skill 2]. Proven track record of [Specific Achievement] at [Previous Company Context]. Seeking to leverage [Unique Value] to drive [Job Goal] at [Company Name]."

Return ONLY the new summary text (no JSON, no explanation, no preamble).`;

        try {
            const response = await this.puter.ai.chat(
                prompt,
                {
                    model: 'claude-sonnet-4-5',
                    max_tokens: 500,
                    temperature: 0.7
                }
            );

            if (!response?.message?.content) {
                throw new Error('Invalid AI response');
            }

            const newSummary = response.message.content.trim();

            // Cache this tailoring result
            const cacheKey = this._generateCacheKey('summary', resume, job);
            this._cacheResult(cacheKey, { summary: newSummary, job, options });

            logger.info(`POWER USER: Summary tailored successfully (${newSummary.length} characters)`);

            return {
                ...resume,
                summary: newSummary,
                tailored: true,
                tailoredFor: job.title
            };
        } catch (error) {
            logger.error('Failed to tailor summary:', error);
            throw new Error(`Summary tailoring failed: ${error.message}`);
        }
    }

    /**
     * POWER USER: Skills Keyword Matching & Prioritization
     *
     * Intelligently reorders skills based on job requirements:
     * - Extracts required skills from job description
     * - Scores each skill by relevance to the JD
     * - Reorders to prioritize matching skills
     * - Preserves ALL original skills (no additions/removals)
     * - Uses fuzzy matching for related terms
     * - Returns prioritized skill list
     *
     * @param {Object} resume - Base resume object
     * @param {Object} job - Job object with requirements
     * @param {Object} options - Options
     * @returns {Promise<Object>} - Tailored resume with prioritized skills
     */
    async tailorSkills(resume, job, options = {}) {
        const { exactMatch = false } = options;

        logger.info(`POWER USER: Tailoring skills for ${job.title}`);

        const currentSkills = resume.skills || [];
        const skillsArray = Array.isArray(currentSkills) ? currentSkills : [currentSkills];

        // POWER USER: Extract required skills from JD
        const requiredSkills = this._extractSkillsFromJD(job);

        logger.info(`Found ${requiredSkills.length} required skills in job description`);

        // Score and reorder skills based on relevance
        const scoredSkills = skillsArray.map(skill => {
            const skillLower = skill.toLowerCase();
            let relevanceScore = 0;
            let matchType = '';

            requiredSkills.forEach(required => {
                const requiredLower = required.toLowerCase();

                // Exact match (highest priority)
                if (skillLower === requiredLower) {
                    relevanceScore += 10;
                    matchType = 'exact';
                }
                // Contains keyword
                else if (skillLower.includes(requiredLower) || requiredLower.includes(skillLower)) {
                    relevanceScore += 5;
                    matchType = 'contains';
                }
                // Related terms (fuzzy matching)
                else if (!exactMatch && this._areRelatedSkills(skillLower, requiredLower)) {
                    relevanceScore += 2;
                    matchType = 'related';
                }
            });

            return { skill, score: relevanceScore, matchType };
        });

        // Sort by relevance score (descending)
        scoredSkills.sort((a, b) => b.score - a.score);

        const reorderedSkills = scoredSkills.map(item => item.skill);

        logger.info(`POWER USER: Skills reordered (top match: "${scoredSkills[0]?.skill}" with score ${scoredSkills[0]?.score})`);

        // Cache this result
        const cacheKey = this._generateCacheKey('skills', resume, job);
        this._cacheResult(cacheKey, { skills: reorderedSkills, job });

        return {
            ...resume,
            skills: reorderedSkills,
            tailored: true,
            tailoredFor: job.title,
            skillsMetadata: {
                totalSkills: reorderedSkills.length,
                topMatches: scoredSkills.filter(s => s.score > 0).length,
                reorderedAt: new Date().toISOString()
            }
        };
    }

    /**
     * POWER USER: Highlight Relevant Experience
     *
     * Reorders work experience to prioritize most relevant roles:
     * - Scores each position by relevance to job requirements
     * - Considers title, skills used, and achievements
     * - Applies recency bonus (more recent = higher score)
     * - Returns reordered experience array
     *
     * @param {Object} resume - Base resume object
     * @param {Object} job - Job object
     * @returns {Promise<Object>} - Resume with highlighted experience
     */
    async highlightRelevantExperience(resume, job) {
        logger.info(`POWER USER: Highlighting relevant experience for ${job.title}`);

        const experience = resume.experience || [];
        const jobKeywords = this._extractKeywordsFromJD(job);

        // Score each experience
        const scoredExperience = experience.map(exp => {
            let relevanceScore = 0;

            // Check title relevance
            const titleLower = exp.title?.toLowerCase() || '';
            jobKeywords.forEach(keyword => {
                if (titleLower.includes(keyword.toLowerCase())) {
                    relevanceScore += 5;
                }
            });

            // Check description relevance
            const descLower = exp.description?.toLowerCase() || '';
            jobKeywords.forEach(keyword => {
                if (descLower.includes(keyword.toLowerCase())) {
                    relevanceScore += 3;
                }
            });

            // Check skills used
            const expSkills = exp.skills || [];
            expSkills.forEach(skill => {
                jobKeywords.forEach(keyword => {
                    if (skill.toLowerCase().includes(keyword.toLowerCase())) {
                        relevanceScore += 2;
                    }
                });
            });

            // Recency bonus (decay over 5 years)
            if (exp.startDate) {
                const startDate = new Date(exp.startDate);
                const yearsSinceStart = (new Date() - startDate) / (1000 * 60 * 60 * 24 * 365);
                relevanceScore += Math.max(0, 5 - yearsSinceStart);
            }

            return { ...exp, relevanceScore };
        });

        // Sort by relevance
        scoredExperience.sort((a, b) => b.relevanceScore - a.relevanceScore);

        logger.info(`POWER USER: Experience reordered (top: ${scoredExperience[0]?.title})`);

        return {
            ...resume,
            experience: scoredExperience,
            tailored: true,
            experienceMetadata: {
                totalPositions: scoredExperience.length,
                reorderedAt: new Date().toISOString()
            }
        };
    }

    /**
     * POWER USER: Full Resume Tailoring with All Features
     *
     * Comprehensive resume customization combining all power user features:
     * 1. Dynamic summary rewriting
     * 2. Skills keyword matching and prioritization
     * 3. Relevant experience highlighting
     * 4. Caching for performance
     * 5. Metadata tracking
     *
     * @param {Object} resume - Base resume object
     * @param {Object} job - Job object
     * @param {Object} options - Tailoring options
     * @returns {Promise<Object>} - Fully tailored resume with metadata
     */
    /**
     * Inject specific keywords into the resume for ATS optimization
     */
    async injectKeywords(resume, job) {
        logger.info(`Injecting keywords into resume for ${job.title}...`);
        
        const prompt = `You are an ATS optimization expert. Take this resume and the job description, and return an updated resume JSON that has 5-10 specific technical keywords from the job description naturally injected into the skills or experience sections.

RESUME:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION:
${job.description}

INSTRUCTIONS:
1. Identify missing high-priority technical keywords.
2. Embed them NATURALLY.
3. Do not invent experience.
4. Return ONLY valid JSON.`;

        try {
            const response = await this.puter.ai.chat(prompt, { model: 'claude-sonnet-4-5' });
            return JSON.parse(response.message.content.match(/\{[\s\S]*\}/)[0]);
        } catch (error) {
            logger.warn('Keyword injection failed, returning original tailored resume');
            return resume;
        }
    }

    async tailorResume(resume, job, options = {}) {
        const {
            tailorSummary = true,
            tailorSkills = true,
            highlightExperience = true,
            save = false,
            tone = 'professional'
        } = options;

        logger.info(`POWER USER: Full resume tailoring for ${job.title} at ${job.company || 'Unknown'}`);

        // Check cache first
        const cacheKey = this._generateCacheKey('full', resume, job, options);
        const cached = this.tailoringCache.get(cacheKey);
        if (cached) {
            logger.info('POWER USER: Using cached tailored resume');
            return cached;
        }

        let tailoredResume = { ...resume };

        // Apply all tailoring features
        if (tailorSummary) {
            tailoredResume = await this.tailorSummary(tailoredResume, job, { tone });
        }

        if (tailorSkills) {
            tailoredResume = await this.tailorSkills(tailoredResume, job);
        }

        if (highlightExperience) {
            tailoredResume = await this.highlightRelevantExperience(tailoredResume, job);
        }

        tailoredResume = await this.injectKeywords(tailoredResume, job);

        const atsAnalysis = atsChecker.checkCompatibility(tailoredResume, job);
        tailoredResume.atsScore = atsAnalysis.score;
        tailoredResume.atsAnalysis = atsAnalysis;

        tailoredResume.tailoringMetadata = {

            tailoredAt: new Date().toISOString(),
            forJob: {
                title: job.title,
                company: job.company,
                location: job.location
            },
            featuresApplied: {
                summaryRewritten: tailorSummary,
                skillsReordered: tailorSkills,
                experienceHighlighted: highlightExperience
            },
            baseResumeHash: this._hashObject(resume)
        };

        // Save if requested
        if (save) {
            const filename = `tailored_${job.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
            await this.saveResume(tailoredResume, filename);
        }

        // Cache result
        this._cacheResult(cacheKey, tailoredResume);

        logger.info('POWER USER: Full resume tailoring completed');
        return tailoredResume;
    }

    // ========== POWER USER HELPER METHODS ==========

    /**
     * Extract keywords from job description
     * @private
     * @param {Object} job - Job object
     * @returns {Array<string>} - Keywords array
     */
    _extractKeywordsFromJD(job) {
        const keywords = [];
        const description = job.description || '';
        const requirements = job.requirements || '';

        // Common tech keywords to look for
        const techKeywords = [
            'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
            'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
            'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql',
            'graphql', 'rest', 'api', 'microservices', 'ci/cd', 'agile', 'scrum'
        ];

        // Extract from description
        const text = (description + ' ' + requirements).toLowerCase();
        techKeywords.forEach(keyword => {
            if (text.includes(keyword) && !keywords.includes(keyword)) {
                keywords.push(keyword);
            }
        });

        // Extract from title
        if (job.title) {
            const titleWords = job.title.split(/\s+/);
            keywords.push(...titleWords.filter(w => w.length > 3));
        }

        return [...new Set(keywords)]; // Deduplicate
    }

    /**
     * Extract skills from job description
     * @private
     * @param {Object} job - Job object
     * @returns {Array<string>} - Skills array
     */
    _extractSkillsFromJD(job) {
        const skills = [];
        const text = (job.description || '' + ' ' + job.requirements || '').toLowerCase();

        // Look for explicit skill sections
        const skillSectionMatches = text.match(
            /(?:skills|technologies|requirements|qualifications)[:\s]+([^\n]+)/gi
        );

        if (skillSectionMatches) {
            skillSectionMatches.forEach(match => {
                const extractedSkills = match.split(/[,•\-\n]/)
                    .map(s => s.trim())
                    .filter(s => s.length > 2);
                skills.push(...extractedSkills);
            });
        }

        // Common tech skills
        const commonSkills = [
            'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'go', 'rust',
            'react', 'angular', 'vue', 'node', 'express', 'next', 'nuxt',
            'django', 'flask', 'spring', 'rails', 'laravel',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'graphql', 'rest', 'api', 'microservices', 'git', 'ci/cd'
        ];

        commonSkills.forEach(skill => {
            const regex = new RegExp(`\\b${skill}\\b`, 'i');
            if (regex.test(text) && !skills.some(s => s.toLowerCase().includes(skill))) {
                skills.push(skill);
            }
        });

        return [...new Set(skills)];
    }

    /**
     * Check if two skills are related
     * @private
     * @param {string} skill1 - First skill
     * @param {string} skill2 - Second skill
     * @returns {boolean} - True if related
     */
    _areRelatedSkills(skill1, skill2) {
        const relatedMap = {
            'javascript': ['typescript', 'node', 'react', 'angular', 'vue', 'jsx'],
            'typescript': ['javascript', 'node', 'react', 'angular'],
            'react': ['javascript', 'typescript', 'jsx', 'redux', 'next'],
            'node': ['javascript', 'typescript', 'express', 'npm'],
            'python': ['django', 'flask', 'pandas', 'numpy', 'fastapi'],
            'aws': ['cloud', 'ec2', 's3', 'lambda', 'rds'],
            'docker': ['kubernetes', 'container', 'devops', 'ci/cd'],
            'sql': ['database', 'mysql', 'postgresql', 'oracle', 'mssql']
        };

        const related1 = relatedMap[skill1] || [];
        const related2 = relatedMap[skill2] || [];

        return related1.includes(skill2) || related2.includes(skill1);
    }

    /**
     * Generate cache key
     * @private
     * @param {string} type - Cache type
     * @param {Object} resume - Resume object
     * @param {Object} job - Job object
     * @param {Object} options - Options
     * @returns {string} - Cache key
     */
    _generateCacheKey(type, resume, job, options = {}) {
        const parts = [
            type,
            job.title?.replace(/[^a-z0-9]/gi, '_'),
            job.company?.replace(/[^a-z0-9]/gi, '_'),
            JSON.stringify(options)
        ];
        return parts.join(':');
    }

    /**
     * Cache result with LRU eviction
     * @private
     * @param {string} key - Cache key
     * @param {Object} value - Value to cache
     */
    _cacheResult(key, value) {
        // LRU: Delete oldest if at capacity
        if (this.tailoringCache.size >= this.maxCacheSize) {
            const firstKey = this.tailoringCache.keys().next().value;
            this.tailoringCache.delete(firstKey);
        }

        this.tailoringCache.set(key, value);
    }

    /**
     * Hash object for comparison
     * @private
     * @param {Object} obj - Object to hash
     * @returns {string} - Hash string
     */
    _hashObject(obj) {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Create Master "Default Resume" from technical and sales versions
     * @param {Object} technicalResume - Primary dev/AI/ML experience
     * @param {Object} salesResume - Sales/Solutions engineering experience
     * @returns {Promise<Object>} - Synthesized master resume
     */
    async createMasterResume(technicalResume, salesResume) {
        logger.info('Creating Master "Default Resume" by synthesizing technical and sales versions...');

        const prompt = `You are a world-class executive resume writer. Synthesize the two attached resumes (Technical and Sales) into a single optimized "Master Default Resume".

TECHNICAL RESUME:
${JSON.stringify(technicalResume, null, 2)}

SALES RESUME:
${JSON.stringify(salesResume, null, 2)}

INSTRUCTIONS:
1. **Structure**: Create a hybrid structure that emphasizes recent AI/ML work.
2. **Job Gap Narrative**: If you detect gaps, frame them as "Independent AI Consultant" or "Freelance ML Engineer" with specific deliverables.
3. **Emphasis**: Put recent AI/ML work front-and-center, with Sales Engineering as a secondary strength.
4. **Quantify**: Use metrics wherever possible (e.g., "improved X by Y%").
5. **Format**: Clean, ATS-optimized JSON structure.

Return ONLY the synthesized resume as a valid JSON object.`;

        try {
            const response = await this.puter.ai.chat(
                prompt,
                {
                    model: 'claude-sonnet-4-5',
                    max_tokens: 4000,
                    temperature: 0.5
                }
            );

            const masterResume = JSON.parse(response.message.content.match(/\{[\s\S]*\}/)[0]);
            logger.info('Master resume synthesized successfully');
            return masterResume;
        } catch (error) {
            logger.error('Failed to synthesize master resume:', error);
            throw error;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getCacheStats() {
        return {
            size: this.tailoringCache.size,
            maxSize: this.maxCacheSize,
            utilization: `${Math.round((this.tailoringCache.size / this.maxCacheSize) * 100)}%`
        };
    }

    /**
     * Generate a custom cover letter for a job
     * @param {Object} resume - Resume object
     * @param {Object} job - Job object
     * @param {Object} options - Options { tone, length }
     * @returns {Promise<string>} - Cover letter text
     */
    async generateCoverLetter(resume, job, options = {}) {
        const { tone = 'confident', length = 400 } = options;

        logger.info(`Generating cover letter for ${job.title}`);

        const prompt = `You are an expert cover letter writer. Generate a professional cover letter.

Applicant Name: ${resume.name || 'Applicant'}
Applicant Summary: ${resume.summary || 'Not provided'}
Key Skills: ${Array.isArray(resume.skills) ? resume.skills.slice(0, 5).join(', ') : resume.skills || 'Not provided'}

Job Title: ${job.title}
Company: ${job.company || 'Unknown'}
Job Description: ${job.description || 'Not provided'}

Instructions:
1. Write a ${tone} cover letter
2. Target length: ~${length} words
3. Connect applicant's experience to job requirements
4. Show genuine interest in the company
5. Include a call to action
6. Return ONLY the cover letter text (no JSON, no explanation)`;

        try {
            const response = await this.puter.ai.chat(
                prompt,
                {
                    model: 'claude-sonnet-4-5',
                    max_tokens: 1000,
                    temperature: 0.8
                }
            );

            if (!response?.message?.content) {
                throw new Error('Invalid AI response');
            }

            const coverLetter = response.message.content.trim();
            logger.info('Cover letter generated successfully');

            return coverLetter;
        } catch (error) {
            logger.error('Failed to generate cover letter:', error);
            throw new Error(`Cover letter generation failed: ${error.message}`);
        }
    }

    /**
     * Validate resume structure
     * @param {Object} resume - Resume object to validate
     * @returns {Object} - Validation result with errors/warnings
     */
    validateResume(resume) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!resume.name) errors.push('Missing required field: name');
        if (!resume.contact) errors.push('Missing required field: contact');
        if (!resume.summary) warnings.push('Missing recommended field: summary');
        if (!resume.skills || resume.skills.length === 0) warnings.push('Missing recommended field: skills');

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

// Export singleton instance
export const resumeService = new ResumeService();
