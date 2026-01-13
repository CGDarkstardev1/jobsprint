import { logger } from './logger.js';

/**
 * ATS Checker Utility
 * 
 * Provides a compatibility score (0-100) by comparing a resume 
 * against a job description, focusing on keyword density and formatting.
 */
export const atsChecker = {
    /**
     * Calculate compatibility score
     * @param {Object} resume - Tailored resume object
     * @param {Object} job - Job description object
     * @returns {Object} - Score and detailed analysis
     */
    checkCompatibility(resume, job) {
        logger.info(`Checking ATS compatibility for ${job.title}...`);

        const jdText = (job.description + ' ' + (job.requirements || '')).toLowerCase();
        const resumeText = JSON.stringify(resume).toLowerCase();
        
        // 1. Keyword Matching
        const keywords = this._extractKeywords(jdText);
        let matchCount = 0;
        const missing = [];

        keywords.forEach(kw => {
            if (resumeText.includes(kw)) {
                matchCount++;
            } else {
                missing.push(kw);
            }
        });

        const keywordScore = keywords.length > 0 ? (matchCount / keywords.length) * 70 : 70;

        // 2. Formatting & Structure (Simulated)
        let structureScore = 30;
        if (!resume.summary) structureScore -= 5;
        if (!resume.skills || resume.skills.length < 5) structureScore -= 10;
        if (!resume.experience || resume.experience.length === 0) structureScore -= 15;

        const totalScore = Math.round(keywordScore + structureScore);

        return {
            score: totalScore,
            keywordMatch: `${matchCount}/${keywords.length}`,
            missingKeywords: missing.slice(0, 10),
            recommendation: totalScore > 80 ? 'Ready to Apply' : 'Needs more tailoring'
        };
    },

    _extractKeywords(text) {
        // Simple extraction of technical-looking terms
        const commonTech = [
            'python', 'pytorch', 'tensorflow', 'scikit-learn', 'numpy', 'pandas',
            'langchain', 'openai', 'llm', 'aws', 'gcp', 'azure', 'docker', 'kubernetes',
            'sql', 'nosql', 'mongodb', 'postgresql', 'react', 'node.js', 'typescript'
        ];
        
        return commonTech.filter(kw => text.includes(kw));
    }
};
