/**
 * Onboarding Flow Service
 *
 * Features reverse-engineered from AutoApply.jobs 6-step onboarding
 * Multi-step guided setup process for complete user profile
 */

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  field: string;
  options?: string[];
  required: boolean;
}

export interface UserProfile {
  targetRole: string;
  targetLocations: string[];
  salaryExpectation: number;
  experience: number;
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'remote';
  startDate: string;
  additionalInfo: string;
}

export class OnboardingService {
  private steps: OnboardingStep[];

  constructor() {
    this.steps = [
      {
        id: 1,
        title: 'What job role are you looking for?',
        description: 'Enter your target job title or role',
        field: 'targetRole',
        required: true,
      },
      {
        id: 2,
        title: 'Where do you want to work?',
        description: 'Select your preferred locations',
        field: 'targetLocations',
        required: true,
        options: [
          'Remote',
          'New York',
          'San Francisco',
          'Los Angeles',
          'Chicago',
          'Boston',
          'Seattle',
          'Austin',
          'London',
          'Other',
        ],
      },
      {
        id: 3,
        title: "What's your salary expectation?",
        description: 'Enter your expected annual salary',
        field: 'salaryExpectation',
        required: true,
      },
      {
        id: 4,
        title: 'How many years of experience do you have?',
        description: 'Select your experience level',
        field: 'experience',
        required: true,
        options: ['0-1 years', '2-3 years', '4-5 years', '6-10 years', '10+ years'],
      },
      {
        id: 5,
        title: 'Upload your resume',
        description: 'Add your resume for AI optimization',
        field: 'resumeUrl',
        required: true,
      },
      {
        id: 6,
        title: 'Almost done! Any additional info?',
        description: 'Share any preferences or requirements',
        field: 'additionalInfo',
        required: false,
      },
    ];
  }

  /**
   * Get all onboarding steps (AutoApply pattern)
   */
  getSteps(): OnboardingStep[] {
    return this.steps;
  }

  /**
   * Get step by ID
   */
  getStep(id: number): OnboardingStep | undefined {
    return this.steps.find((s) => s.id === id);
  }

  /**
   * Validate step data
   */
  validateStep(stepId: number, data: any): { valid: boolean; errors: string[] } {
    const step = this.getStep(stepId);
    if (!step) {
      return { valid: false, errors: ['Step not found'] };
    }

    const errors: string[] = [];

    if (step.required && !data[step.field]) {
      errors.push(`${step.title} is required`);
    }

    if (step.field === 'salaryExpectation' && data[step.field] < 30000) {
      errors.push('Salary expectation seems too low. Please enter a valid amount.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate profile completeness
   */
  calculateCompleteness(profile: Partial<UserProfile>): number {
    const requiredFields = [
      'targetRole',
      'targetLocations',
      'salaryExpectation',
      'experience',
      'resumeUrl',
    ];

    const filledFields = requiredFields.filter((field) => {
      const value = profile[field as keyof UserProfile];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  }

  /**
   * Create user profile from onboarding data
   */
  async createProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return {
      targetRole: data.targetRole || '',
      targetLocations: data.targetLocations || [],
      salaryExpectation: data.salaryExpectation || 0,
      experience: data.experience || 0,
      skills: data.skills || [],
      resumeUrl: data.resumeUrl,
      linkedinUrl: data.linkedinUrl,
      employmentType: data.employmentType || 'full-time',
      startDate: data.startDate || '',
      additionalInfo: data.additionalInfo || '',
    };
  }
}

export const onboardingService = new OnboardingService();
