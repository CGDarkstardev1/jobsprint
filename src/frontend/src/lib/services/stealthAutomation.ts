/**
 * Stealth/Human-like Automation Mode
 *
 * Features reverse-engineered from JobCopilot.com's stealth mode
 * Human-like behavior patterns to avoid bot detection by ATS platforms
 */

export interface StealthConfig {
  typingSpeed: { min: number; max: number };
  delayBetweenActions: { min: number; max: number };
  randomBreaks: boolean;
  breakDuration: { min: number; max: number };
  userAgentRotation: boolean;
  viewportVariation: boolean;
  mouseMovement: boolean;
}

export interface AutomationSession {
  sessionId: string;
  platform: string;
  startTime: Date;
  actions: AutomationAction[];
  stealthScore: number;
}

export interface AutomationAction {
  type: 'click' | 'type' | 'scroll' | 'wait' | 'navigate';
  element: string;
  timestamp: Date;
  duration?: number;
  data?: any;
}

export class StealthAutomationService {
  private config: StealthConfig;
  private sessionHistory: AutomationSession[];

  constructor() {
    this.config = this.getDefaultConfig();
    this.sessionHistory = [];
  }

  private getDefaultConfig(): StealthConfig {
    return {
      typingSpeed: { min: 50, max: 150 }, // ms per character
      delayBetweenActions: { min: 500, max: 2000 }, // ms
      randomBreaks: true,
      breakDuration: { min: 30000, max: 120000 }, // 30s - 2min
      userAgentRotation: true,
      viewportVariation: true,
      mouseMovement: true,
    };
  }

  /**
   * Generate human-like typing delay (JobCopilot pattern)
   */
  generateTypingDelay(text: string): number {
    const baseDelay = this.config.typingSpeed.min;
    const variance = this.config.typingSpeed.max - this.config.typingSpeed.min;
    const variancePerChar = variance / text.length;

    return Math.round(text.length * (baseDelay + Math.random() * variancePerChar));
  }

  /**
   * Generate random delay between actions
   */
  generateActionDelay(): number {
    const { min, max } = this.config.delayBetweenActions;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Determine if should take a random break
   */
  shouldTakeBreak(): boolean {
    if (!this.config.randomBreaks) return false;
    return Math.random() < 0.1; // 10% chance
  }

  /**
   * Generate break duration
   */
  generateBreakDuration(): number {
    const { min, max } = this.config.breakDuration;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random user agent string
   */
  getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Get random viewport dimensions
   */
  getRandomViewport(): { width: number; height: number } {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 1280, height: 720 },
    ];

    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * Generate human-like mouse movement path
   */
  generateMousePath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): { x: number; y: number; timestamp: number }[] {
    const points: { x: number; y: number; timestamp: number }[] = [];
    const duration = 500 + Math.random() * 500; // 500ms - 1s
    const steps = 20;
    const timestampStep = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // Add some randomness
      const noiseX = (Math.random() - 0.5) * 20;
      const noiseY = (Math.random() - 0.5) * 20;

      points.push({
        x: startX + (endX - startX) * easeT + noiseX,
        y: startY + (endY - startY) * easeT + noiseY,
        timestamp: Date.now() + i * timestampStep,
      });
    }

    return points;
  }

  /**
   * Calculate stealth score for current session
   */
  calculateStealthScore(session: AutomationSession): number {
    let score = 100;

    // Check action variety
    const actionTypes = new Set(session.actions.map((a) => a.type));
    score -= (5 - actionTypes.size) * 5; // Penalize if only one action type

    // Check for randomness in delays
    const delays = session.actions.filter((a) => a.duration).map((a) => a.duration!);

    if (delays.length > 1) {
      const variance = this.calculateVariance(delays);
      score -= Math.min(variance / 100, 20); // Penalize low variance
    }

    // Check for breaks
    const hasBreaks = session.actions.some((a) => a.type === 'wait' && a.duration! > 10000);
    if (!hasBreaks) score -= 10; // Penalize no long breaks

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Start a new automation session
   */
  startSession(platform: string): AutomationSession {
    return {
      sessionId: `session_${Date.now()}`,
      platform,
      startTime: new Date(),
      actions: [],
      stealthScore: 100,
    };
  }

  /**
   * Record an automation action
   */
  recordAction(session: AutomationSession, action: Omit<AutomationAction, 'timestamp'>): void {
    session.actions.push({
      ...action,
      timestamp: new Date(),
    });
    session.stealthScore = this.calculateStealthScore(session);
  }

  /**
   * Get stealth configuration for a platform
   */
  getPlatformConfig(platform: string): StealthConfig {
    // Platform-specific adjustments
    const baseConfig = { ...this.config };

    switch (platform.toLowerCase()) {
      case 'linkedin':
        // LinkedIn is more strict with automation
        baseConfig.delayBetweenActions = { min: 2000, max: 5000 };
        baseConfig.typingSpeed = { min: 100, max: 200 };
        baseConfig.breakDuration = { min: 60000, max: 300000 }; // 1-5 min breaks
        break;
      case 'indeed':
        // Indeed is more lenient
        baseConfig.delayBetweenActions = { min: 500, max: 1500 };
        break;
      default:
        break;
    }

    return baseConfig;
  }
}

export const stealthAutomationService = new StealthAutomationService();
