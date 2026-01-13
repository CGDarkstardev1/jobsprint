/**
 * Application Analytics Dashboard
 *
 * Features reverse-engineered from LazyApply.com's Application Analytics
 * Real-time tracking of applications, responses, and success metrics
 */

export interface ApplicationMetrics {
  totalApplications: number;
  pendingApplications: number;
  viewedApplications: number;
  respondedApplications: number;
  interviewRequests: number;
  offersReceived: number;
  rejections: number;
}

export interface DailyMetrics {
  date: string;
  applications: number;
  responses: number;
  interviews: number;
}

export interface PlatformMetrics {
  platform: string;
  applications: number;
  successRate: number;
  avgResponseTime: number;
}

export interface AnalyticsDashboard {
  metrics: ApplicationMetrics;
  dailyTrends: DailyMetrics[];
  platformBreakdown: PlatformMetrics[];
  successRate: number;
  responseRate: number;
  interviewRate: number;
  conversionFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

export class AnalyticsDashboardService {
  private storageKey = 'jobSprint_analytics';

  /**
   * Get comprehensive analytics dashboard (LazyApply.com pattern)
   */
  async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    const applications = await this.getApplications(userId);

    const metrics = this.calculateMetrics(applications);
    const dailyTrends = this.calculateDailyTrends(applications);
    const platformBreakdown = this.calculatePlatformBreakdown(applications);
    const conversionFunnel = this.calculateConversionFunnel(applications);

    return {
      metrics,
      dailyTrends,
      platformBreakdown,
      successRate: this.calculateSuccessRate(metrics),
      responseRate: this.calculateResponseRate(metrics),
      interviewRate: this.calculateInterviewRate(metrics),
      conversionFunnel,
    };
  }

  /**
   * Track a new application
   */
  async trackApplication(
    userId: string,
    application: {
      platform: string;
      company: string;
      position: string;
      status: 'pending' | 'viewed' | 'responded' | 'interview' | 'offer' | 'rejected';
      timestamp: Date;
    }
  ): Promise<void> {
    const applications = await this.getApplications(userId);
    applications.push({
      ...application,
      id: `app_${Date.now()}`,
      userId,
    });

    await this.saveApplications(userId, applications);
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: Application['status']
  ): Promise<void> {
    const applications = await this.getApplications(userId);
    const index = applications.findIndex((a) => a.id === applicationId);

    if (index !== -1) {
      applications[index].status = status;
      applications[index].lastUpdated = new Date();
      await this.saveApplications(userId, applications);
    }
  }

  /**
   * Calculate all metrics from applications
   */
  private calculateMetrics(applications: Application[]): ApplicationMetrics {
    return {
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === 'pending').length,
      viewedApplications: applications.filter((a) => a.status === 'viewed').length,
      respondedApplications: applications.filter((a) =>
        ['responded', 'interview', 'offer'].includes(a.status)
      ).length,
      interviewRequests: applications.filter((a) => a.status === 'interview').length,
      offersReceived: applications.filter((a) => a.status === 'offer').length,
      rejections: applications.filter((a) => a.status === 'rejected').length,
    };
  }

  /**
   * Calculate daily trends
   */
  private calculateDailyTrends(applications: Application[]): DailyMetrics[] {
    const last30Days = new Map<string, DailyMetrics>();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.set(dateStr, {
        date: dateStr,
        applications: 0,
        responses: 0,
        interviews: 0,
      });
    }

    // Aggregate data
    for (const app of applications) {
      const dateStr = app.timestamp.toISOString().split('T')[0];
      const metrics = last30Days.get(dateStr);
      if (metrics) {
        metrics.applications++;
        if (['responded', 'interview', 'offer'].includes(app.status)) {
          metrics.responses++;
        }
        if (app.status === 'interview' || app.status === 'offer') {
          metrics.interviews++;
        }
      }
    }

    return Array.from(last30Days.values());
  }

  /**
   * Calculate platform breakdown (LazyApply pattern)
   */
  private calculatePlatformBreakdown(applications: Application[]): PlatformMetrics[] {
    const platformData = new Map<string, Application[]>();

    for (const app of applications) {
      const apps = platformData.get(app.platform) || [];
      apps.push(app);
      platformData.set(app.platform, apps);
    }

    const breakdown: PlatformMetrics[] = [];

    for (const [platform, apps] of platformData) {
      const successful = apps.filter((a) => ['interview', 'offer'].includes(a.status)).length;

      breakdown.push({
        platform,
        applications: apps.length,
        successRate: apps.length > 0 ? (successful / apps.length) * 100 : 0,
        avgResponseTime: this.calculateAvgResponseTime(apps),
      });
    }

    return breakdown.sort((a, b) => b.applications - a.applications);
  }

  /**
   * Calculate conversion funnel
   */
  private calculateConversionFunnel(applications: Application[]): {
    stage: string;
    count: number;
    percentage: number;
  }[] {
    const total = applications.length || 1;

    return [
      { stage: 'Applied', count: applications.length, percentage: 100 },
      {
        stage: 'Viewed',
        count: applications.filter((a) =>
          ['viewed', 'responded', 'interview', 'offer', 'rejected'].includes(a.status)
        ).length,
        percentage: Math.round(
          (applications.filter((a) =>
            ['viewed', 'responded', 'interview', 'offer', 'rejected'].includes(a.status)
          ).length /
            total) *
            100
        ),
      },
      {
        stage: 'Responded',
        count: applications.filter((a) => ['responded', 'interview', 'offer'].includes(a.status))
          .length,
        percentage: Math.round(
          (applications.filter((a) => ['responded', 'interview', 'offer'].includes(a.status))
            .length /
            total) *
            100
        ),
      },
      {
        stage: 'Interview',
        count: applications.filter((a) => ['interview', 'offer'].includes(a.status)).length,
        percentage: Math.round(
          (applications.filter((a) => ['interview', 'offer'].includes(a.status)).length / total) *
            100
        ),
      },
      {
        stage: 'Offer',
        count: applications.filter((a) => a.status === 'offer').length,
        percentage: Math.round(
          (applications.filter((a) => a.status === 'offer').length / total) * 100
        ),
      },
    ];
  }

  /**
   * Calculate average response time in days
   */
  private calculateAvgResponseTime(applications: Application[]): number {
    const responded = applications.filter((a) => a.status !== 'pending' && a.lastUpdated);

    if (responded.length === 0) return 0;

    const totalDays = responded.reduce((acc, app) => {
      const days = Math.floor(
        (app.lastUpdated!.getTime() - app.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      return acc + days;
    }, 0);

    return Math.round(totalDays / responded.length);
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(metrics: ApplicationMetrics): number {
    if (metrics.totalApplications === 0) return 0;
    return Math.round((metrics.offersReceived / metrics.totalApplications) * 100);
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(metrics: ApplicationMetrics): number {
    if (metrics.totalApplications === 0) return 0;
    return Math.round((metrics.respondedApplications / metrics.totalApplications) * 100);
  }

  /**
   * Calculate interview rate
   */
  private calculateInterviewRate(metrics: ApplicationMetrics): number {
    if (metrics.totalApplications === 0) return 0;
    return Math.round((metrics.interviewRequests / metrics.totalApplications) * 100);
  }

  /**
   * Get applications from storage
   */
  private async getApplications(userId: string): Promise<Application[]> {
    // Implementation would use storage service
    return [];
  }

  /**
   * Save applications to storage
   */
  private async saveApplications(userId: string, applications: Application[]): Promise<void> {
    // Implementation would use storage service
  }
}

// Types
interface Application {
  id: string;
  userId: string;
  platform: string;
  company: string;
  position: string;
  status: 'pending' | 'viewed' | 'responded' | 'interview' | 'offer' | 'rejected';
  timestamp: Date;
  lastUpdated?: Date;
}

export const analyticsDashboardService = new AnalyticsDashboardService();
