/**
 * Approval/Auto Modes Service
 *
 * Features reverse-engineered from AutoApply.jobs approval modes
 * Toggle between manual review and fully automated application submission
 */

export type ApplicationMode = 'approve_first' | 'fully_auto';

export interface ModeConfig {
  mode: ApplicationMode;
  autoApplyDelay: number; // seconds
  batchSize: number;
  notifyOnApply: boolean;
  notifyOnResponse: boolean;
  maxDailyApplications: number;
}

export interface ApplicationPreview {
  id: string;
  platform: string;
  company: string;
  position: string;
  matchScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  previewData: {
    resumeVersion: string;
    coverLetterPreview: string;
    screeningAnswers: Record<string, string>;
  };
  timestamp: Date;
}

export class ApplicationModeService {
  private defaultConfigs: Record<ApplicationMode, ModeConfig>;

  constructor() {
    this.defaultConfigs = {
      approve_first: {
        mode: 'approve_first',
        autoApplyDelay: 0,
        batchSize: 1,
        notifyOnApply: true,
        notifyOnResponse: true,
        maxDailyApplications: 50,
      },
      fully_auto: {
        mode: 'fully_auto',
        autoApplyDelay: 60,
        batchSize: 10,
        notifyOnApply: false,
        notifyOnResponse: true,
        maxDailyApplications: 100,
      },
    };
  }

  /**
   * Get configuration for a specific mode
   */
  getConfig(mode: ApplicationMode): ModeConfig {
    return { ...this.defaultConfigs[mode] };
  }

  /**
   * Update mode configuration
   */
  updateConfig(currentConfig: ModeConfig, updates: Partial<ModeConfig>): ModeConfig {
    return { ...currentConfig, ...updates };
  }

  /**
   * Switch application mode
   */
  async switchMode(
    userId: string,
    newMode: ApplicationMode
  ): Promise<{ success: boolean; config: ModeConfig; message: string }> {
    const config = this.getConfig(newMode);

    // Log mode change
    console.log(`User ${userId} switched to ${newMode} mode`);

    return {
      success: true,
      config,
      message:
        newMode === 'fully_auto'
          ? 'Auto-apply enabled. Applications will be submitted automatically.'
          : "Approval mode enabled. You'll review each application before submission.",
    };
  }

  /**
   * Create application preview for approval
   */
  async createPreview(application: {
    platform: string;
    company: string;
    position: string;
    matchScore: number;
    resumeData: any;
    coverLetterData: any;
    screeningAnswers: Record<string, string>;
  }): Promise<ApplicationPreview> {
    return {
      id: `preview_${Date.now()}`,
      platform: application.platform,
      company: application.company,
      position: application.position,
      matchScore: application.matchScore,
      status: 'pending',
      previewData: {
        resumeVersion: application.resumeData.version || 'tailored',
        coverLetterPreview: application.coverLetterData.preview || '',
        screeningAnswers: application.screeningAnswers,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Approve application for submission
   */
  async approveApplication(
    userId: string,
    previewId: string
  ): Promise<{ success: boolean; status: string }> {
    return {
      success: true,
      status: 'approved',
    };
  }

  /**
   * Reject application
   */
  async rejectApplication(
    userId: string,
    previewId: string,
    reason?: string
  ): Promise<{ success: boolean; status: string }> {
    return {
      success: true,
      status: 'rejected',
    };
  }

  /**
   * Get pending approvals count
   */
  async getPendingApprovals(userId: string): Promise<number> {
    return 0; // Would query database
  }
}

export const applicationModeService = new ApplicationModeService();

/**
 * Pricing Service
 *
 * Features reverse-engineered from JobCopilot.com (weekly) and LazyApply.com (annual)
 * Flexible pricing with weekly, monthly, and annual options
 */

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'weekly' | 'monthly' | 'annual';
  annualPrice?: number;
  features: string[];
  applicationLimit: number;
  aiFeatures: string[];
  support: 'email' | 'priority' | 'dedicated';
}

export interface PricingTier {
  free: PricingPlan;
  weekly: PricingPlan;
  monthly: PricingPlan;
  annual: PricingPlan;
  enterprise: PricingPlan;
}

export class PricingService {
  private tiers: PricingTier;

  constructor() {
    this.tiers = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'monthly',
        features: [
          '10 applications/day',
          'Basic resume builder',
          'Job matching',
          'Application tracking',
        ],
        applicationLimit: 10,
        aiFeatures: [],
        support: 'email',
      },
      weekly: {
        id: 'weekly',
        name: 'Weekly Pro',
        price: 8.9,
        period: 'weekly',
        annualPrice: 399,
        features: [
          'Up to 20 job matches/day',
          'Automated applications',
          'AI cover letters',
          'Interview preparation',
          'Priority support',
        ],
        applicationLimit: 20,
        aiFeatures: ['cover_letters', 'interview_prep', 'resume_tailoring'],
        support: 'priority',
      },
      monthly: {
        id: 'monthly',
        name: 'Monthly Pro',
        price: 49,
        period: 'monthly',
        annualPrice: 470,
        features: [
          'Unlimited applications',
          'All AI features',
          'Advanced analytics',
          'LinkedIn optimizer',
          'Smart referrals',
          'Priority support',
        ],
        applicationLimit: -1,
        aiFeatures: ['all'],
        support: 'priority',
      },
      annual: {
        id: 'annual',
        name: 'Annual Pro',
        price: 39,
        period: 'monthly', // Billed annually at $470
        features: [
          'Everything in Monthly',
          '2 months free',
          'Early access to new features',
          'Dedicated success manager',
        ],
        applicationLimit: -1,
        aiFeatures: ['all'],
        support: 'dedicated',
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 0,
        period: 'monthly',
        features: [
          'Custom limits',
          'Team management',
          'API access',
          'White-label options',
          'Custom integrations',
          'SLA guarantee',
        ],
        applicationLimit: -1,
        aiFeatures: ['all', 'custom'],
        support: 'dedicated',
      },
    };
  }

  /**
   * Get all pricing tiers
   */
  getTiers(): PricingTier {
    return this.tiers;
  }

  /**
   * Get specific plan
   */
  getPlan(planId: string): PricingPlan | undefined {
    return this.tiers[planId as keyof PricingTier];
  }

  /**
   * Calculate annual savings
   */
  calculateAnnualSavings(monthlyPrice: number): { savings: number; percentage: number } {
    const annual = monthlyPrice * 12;
    const discounted = monthlyPrice * 10; // 2 months free
    return {
      savings: annual - discounted,
      percentage: Math.round((savings / annual) * 100),
    };
  }

  /**
   * Get recommended plan based on usage
   */
  getRecommendedPlan(usage: {
    dailyApplications: number;
    usesCoverLetters: boolean;
    usesInterviewPrep: boolean;
    teamSize: number;
  }): string {
    if (usage.teamSize > 1) return 'enterprise';
    if (usage.usesInterviewPrep || usage.usesCoverLetters) {
      return usage.dailyApplications > 20 ? 'annual' : 'weekly';
    }
    return 'free';
  }

  /**
   * Calculate pro-rata refund (Scale.jobs pattern)
   */
  calculateProrataRefund(
    originalPrice: number,
    planDuration: number, // days
    daysUsed: number,
    onboardingFee: number = 100
  ): number {
    const remainingDays = planDuration - daysUsed;
    const dailyRate = originalPrice / planDuration;
    const remainingValue = remainingDays * dailyRate;
    return Math.max(0, remainingValue - onboardingFee);
  }
}

export const pricingService = new PricingService();
