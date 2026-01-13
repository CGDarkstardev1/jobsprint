/**
 * Interview Preparation Module
 *
 * Features reverse-engineered from JobLand.ai and JobCopilot.com
 * Generates mock interview questions and AI-enhanced guidance
 */

import { analyzeJobRequirements } from './atsOptimizer';

interface InterviewQuestion {
  id: string;
  category: 'behavioral' | 'technical' | 'situational' | 'company-specific' | 'salary';
  question: string;
  tips: string[];
  sampleAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface InterviewSession {
  sessionId: string;
  jobDescription: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  userAnswers: Map<string, string>;
  feedback: Map<string, string>;
  score: number;
}

interface InterviewFeedback {
  questionId: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  score: number;
}

export class InterviewPreparationService {
  private questionBank: Map<string, InterviewQuestion[]>;
  private companyQuestions: Map<string, InterviewQuestion[]>;

  constructor() {
    this.questionBank = new Map();
    this.companyQuestions = new Map();
    this.initializeQuestionBank();
  }

  private initializeQuestionBank(): void {
    // Behavioral questions (STAR method)
    this.questionBank.set('behavioral', [
      {
        id: 'b1',
        category: 'behavioral',
        question:
          'Tell me about a time you faced a challenging situation at work and how you handled it.',
        tips: [
          'Use the STAR method: Situation, Task, Action, Result',
          'Be specific about your role and contributions',
          'Quantify the results if possible',
        ],
        sampleAnswer: 'In my previous role, we faced a critical deadline...',
        difficulty: 'medium',
      },
      {
        id: 'b2',
        category: 'behavioral',
        question: 'Describe a situation where you had to work with a difficult team member.',
        tips: [
          "Focus on your actions, not the other person's behavior",
          'Show empathy and problem-solving',
          'Highlight communication skills',
        ],
        difficulty: 'medium',
      },
      {
        id: 'b3',
        category: 'behavioral',
        question: 'Give an example of a goal you reached and tell me how you achieved it.',
        tips: [
          'Choose a significant goal',
          'Explain your process and timeline',
          'Show ownership and initiative',
        ],
        difficulty: 'easy',
      },
      {
        id: 'b4',
        category: 'behavioral',
        question: 'Tell me about a time you failed and what you learned from it.',
        tips: [
          'Choose a real but recoverable failure',
          'Focus on learning and growth',
          'Show resilience and self-awareness',
        ],
        difficulty: 'hard',
      },
    ]);

    // Technical questions (will be customized per job)
    this.questionBank.set('technical', [
      {
        id: 't1',
        category: 'technical',
        question: 'Walk me through your approach to solving a complex technical problem.',
        tips: [
          'Start with understanding the requirements',
          'Discuss alternative approaches you considered',
          'Explain your final choice and reasoning',
        ],
        difficulty: 'medium',
      },
      {
        id: 't2',
        category: 'technical',
        question: 'How do you stay current with industry trends and new technologies?',
        tips: [
          'Mention specific resources (blogs, courses, communities)',
          'Show continuous learning mindset',
          'Give examples of recently learned skills',
        ],
        difficulty: 'easy',
      },
    ]);

    // Situational questions
    this.questionBank.set('situational', [
      {
        id: 's1',
        category: 'situational',
        question: 'How would you handle a situation where you have multiple tight deadlines?',
        tips: [
          'Show prioritization skills',
          'Mention communication with stakeholders',
          'Discuss delegation if applicable',
        ],
        difficulty: 'medium',
      },
    ]);

    // Company-specific questions
    this.questionBank.set('company-specific', [
      {
        id: 'c1',
        category: 'company-specific',
        question: 'Why do you want to work at our company?',
        tips: [
          "Research the company's mission and values",
          "Connect your goals with the company's direction",
          'Show genuine enthusiasm',
        ],
        difficulty: 'easy',
      },
      {
        id: 'c2',
        category: 'company-specific',
        question: 'How do you think you can contribute to our team?',
        tips: [
          'Highlight specific skills that match the role',
          'Show understanding of team dynamics',
          'Demonstrate cultural fit',
        ],
        difficulty: 'medium',
      },
    ]);

    // Salary questions
    this.questionBank.set('salary', [
      {
        id: 'sal1',
        category: 'salary',
        question: 'What are your salary expectations for this role?',
        tips: [
          'Research market rates first',
          'Give a range, not a specific number',
          "Focus on value you'll bring",
        ],
        difficulty: 'hard',
      },
    ]);
  }

  /**
   * Generate personalized interview questions based on job description
   * (JobCopilot.com pattern - AI Mock Interviewer feature)
   */
  async generateInterviewQuestions(
    jobDescription: string,
    resume: string,
    numberOfQuestions: number = 10
  ): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];
    const requirements = await analyzeJobRequirements(jobDescription);

    // Add behavioral questions (always relevant)
    questions.push(...this.questionBank.get('behavioral')!.slice(0, 3));

    // Add technical questions based on job requirements
    const techQuestions = this.generateTechnicalQuestions(requirements);
    questions.push(...techQuestions.slice(0, 3));

    // Add situational questions
    questions.push(...this.questionBank.get('situational')!.slice(0, 2));

    // Add company-specific questions (placeholder - would need company research)
    questions.push(...this.questionBank.get('company-specific')!.slice(0, 2));

    // Add salary question if applicable
    if (requirements.salaryRange) {
      questions.push(this.questionBank.get('salary')![0]);
    }

    return questions.slice(0, numberOfQuestions);
  }

  /**
   * Generate technical questions based on job requirements
   */
  private generateTechnicalQuestions(requirements: any): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const { requiredSkills, preferredSkills } = requirements;

    // Generate skill-based questions
    for (const skill of requiredSkills.slice(0, 5)) {
      questions.push({
        id: `tech_${skill.replace(/\s+/g, '_')}`,
        category: 'technical',
        question: `Describe your experience with ${skill} and provide an example of how you've used it in a project.`,
        tips: [
          `Focus on ${skill} fundamentals`,
          'Give a specific project example',
          'Mention outcomes and impact',
        ],
        difficulty: 'medium',
      });
    }

    return questions;
  }

  /**
   * Create a new interview practice session
   */
  async createSession(jobDescription: string, userId: string): Promise<InterviewSession> {
    const resume = ''; // Would fetch from user profile

    const questions = await this.generateInterviewQuestions(jobDescription, resume);

    return {
      sessionId: `session_${Date.now()}`,
      jobDescription,
      questions,
      currentQuestionIndex: 0,
      userAnswers: new Map(),
      feedback: new Map(),
      score: 0,
    };
  }

  /**
   * Evaluate user's answer and provide feedback
   * (JobCopilot.com AI Interviewer pattern)
   */
  async evaluateAnswer(
    session: InterviewSession,
    questionId: string,
    userAnswer: string
  ): Promise<InterviewFeedback> {
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // AI-powered evaluation (simplified - would use LLM in production)
    const feedback = await this.analyzeAnswer(question, userAnswer);

    // Store feedback
    session.userAnswers.set(questionId, userAnswer);
    session.feedback.set(questionId, feedback.suggestedAnswer);

    // Update session score
    session.score = this.calculateSessionScore(session);

    return feedback;
  }

  /**
   * Analyze answer using AI (would integrate with LLM)
   */
  private async analyzeAnswer(
    question: InterviewQuestion,
    userAnswer: string
  ): Promise<InterviewFeedback> {
    // Simplified scoring based on answer length and keywords
    const wordCount = userAnswer.split(/\s+/).length;
    const hasStructure = /\b(because|therefore|first|then|result)\b/i.test(userAnswer);
    const hasSpecifics = /\b(I|we|my|our)\b/i.test(userAnswer);

    let score = 50; // Base score
    if (wordCount > 50) score += 20;
    if (wordCount > 100) score += 10;
    if (hasStructure) score += 10;
    if (hasSpecifics) score += 10;

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wordCount > 50) {
      strengths.push('Good answer length - detailed enough');
    } else {
      improvements.push('Consider providing more detail in your answer');
    }

    if (hasStructure) {
      strengths.push('Well-structured response');
    } else {
      improvements.push('Try using the STAR method for behavioral questions');
    }

    if (hasSpecifics) {
      strengths.push('Good use of specific examples');
    } else {
      improvements.push('Include specific examples from your experience');
    }

    return {
      questionId: question.id,
      strengths,
      improvements,
      suggestedAnswer: question.sampleAnswer || 'This is a placeholder for AI-generated feedback.',
      score: Math.min(score, 100),
    };
  }

  /**
   * Calculate overall session score
   */
  private calculateSessionScore(session: InterviewSession): number {
    let totalScore = 0;
    let count = 0;

    for (const [questionId, feedback] of session.feedback) {
      // In real implementation, store scores separately
      totalScore += 75; // Placeholder
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * Get interview tips for a specific category
   */
  getTipsByCategory(category: InterviewQuestion['category']): string[] {
    const questions = this.questionBank.get(category);
    if (!questions || questions.length === 0) {
      return [];
    }

    const tips = new Set<string>();
    for (const question of questions) {
      for (const tip of question.tips) {
        tips.add(tip);
      }
    }

    return Array.from(tips);
  }

  /**
   * Get salary negotiation advice (JobCopilot.com pattern)
   */
  getSalaryNegotiationAdvice(jobOffer: {
    salary: number;
    benefits: string[];
    company: string;
  }): string[] {
    return [
      `Research market rates for ${jobOffer.company} - typically 10-20% above current market`,
      'Wait for the offer before discussing salary specifics',
      'Consider the entire compensation package, not just base salary',
      'Practice your negotiation script: "I\'m excited about this opportunity..."',
      "Don't accept immediately - ask for 24-48 hours to consider",
      "If they can't meet your terms, ask what can be negotiated (bonus, equity, PTO)",
    ];
  }
}

export const interviewPreparationService = new InterviewPreparationService();
