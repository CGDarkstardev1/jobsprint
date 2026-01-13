/**
 * Anti-Detection Infrastructure
 * Combines best practices from LazyApply, automation research, and security analysis
 * Implements proxy rotation, behavioral realism, request fingerprinting, and stealth techniques
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export type ProxyConfig = {
  proxyUrl: string;
  proxyType: 'residential' | 'mobile' | 'datacenter';
  proxyCredentials: {
    username: string;
    password: string;
    port?: number;
  };
};

export type BrowserProfile = {
  userAgent: string;
  viewport: { width: number; height: number };
  screen: { width: number; height: number; colorDepth: number };
  platform: string;
  timezone: string;
  language: string;
};

export type RequestFingerprint = {
  headers: Record<string, string>;
  userAgent: string;
  tlsFingerprint: string;
  screenResolution: string;
  platformInfo: string;
  timezone: string;
};

export type AntiDetectionConfig = {
  minDelay: number;
  maxDelay: number;
  randomDelayRange: number;
  enableProxyRotation: boolean;
  enableFingerprintRotation: boolean;
  enableBehavioralSimulation: boolean;
  rateLimitPerProxy: number;
  requestsPerMinute: number;
  stealthOptions: {
    disableWebGlitch: boolean;
    disableCanvasFingerprint: boolean;
    disableWebRTC: boolean;
    disableCSSExtraction: boolean;
  };
};

export type DetectionResult = {
  isDetected: boolean;
  confidence: number;
  detectedBy: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
};

export type ProxyHealth = {
  ip: string;
  type: string;
  location: string;
  speed: number;
  lastUsed: Date;
  successRate: number;
  failureCount: number;
  isHealthy: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class AntiDetectionService {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:53.0)',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'Chrome/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Chrome/119.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/119.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/119.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Chrome/120.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/120.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/120.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Safari/605.1.17 (Macintosh; Intel Mac OS X 10_15_6)',
    'Safari/605.1.17 (Macintosh; Intel Mac OS X 10_15_6)',
    'Safari/605.1.17 (Macintosh; Intel Mac OS X 10_15_6)',
  'Edge/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Edge/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)'
  ];

  private readonly residentialUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:53.0)',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'Chrome/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Chrome/119.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/119.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Chrome/119.0.0.0 (Windows NT 10.0; Win64; x64)',
    'Safari/605.1.17 (Macintosh; Intel Mac OS X 10_15_6)',
    'Safari/605.1.17 (Macintosh; Intel Mac OS X 10_15_6)',
    'Edge/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Edge/120.0.0.0 (Macintosh; Intel Mac OS X 10_15_7)'
  ];

  private proxyPool: ProxyConfig[] = [];
  private proxyHealthCache = new Map<string, ProxyHealth>();
  private currentProxyIndex = 0;

  constructor(private readonly httpService: HttpService) {
    this.initializeProxyPool();
  }

  /**
   * Initialize proxy pool with configuration
   */
  private initializeProxyPool(): void {
    // Initialize with common proxy providers (can be extended)
    this.proxyPool = [
      {
        proxyUrl: 'http://residential-proxy.example.com:8080',
        proxyType: 'residential',
        proxyCredentials: { username: 'user1', password: 'pass1' }
      },
      {
        proxyUrl: 'http://mobile-proxy.example.com:8080',
        proxyType: 'mobile',
        proxyCredentials: { username: 'user2', password: 'pass2' }
      },
      {
        proxyUrl: 'http://datacenter-proxy.example.com:8080',
        proxyType: 'datacenter',
        proxyCredentials: { username: 'user3', password: 'pass3' }
      }
    ];
  }

  /**
   * Generate realistic browser fingerprint
   * Creates rotating, contextually appropriate fingerprints
   */
  generateBrowserProfile(): BrowserProfile {
    const agent = this.residentialUserAgents[Math.floor(Math.random() * this.residentialUserAgents.length)];
    const baseProfile = this.parseUserAgent(agent);

    return {
      userAgent: agent,
      viewport: { 
        width: 1366 + Math.floor(Math.random() * 200), 
        height: 768 + Math.floor(Math.random() * 200)
      },
      screen: { 
        width: 1366 + Math.floor(Math.random() * 200), 
        height: 768 + Math.floor(Math.random() * 200), 
        colorDepth: 24 + Math.floor(Math.random() * 8)
      },
      platform: this.extractPlatform(baseProfile.userAgent),
      timezone: this.getRandomTimezone(),
      language: 'en-US'
    };
  }

  /**
   * Extract platform from user agent
   */
  private extractPlatform(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  /**
   * Parse user agent string for components
   */
  private parseUserAgent(userAgent: string): any {
    const match = userAgent.match(/(Mozilla|Chrome|Safari|Edge)[\/\s]([\d.]+)/);
    if (!match) return null;

    return {
      browser: match[1],
      version: match[2],
      system: match[3] || ''
    };
  }

  /**
   * Get random timezone for realism
   */
  private getRandomTimezone(): string {
    const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
      'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Check request fingerprint against detection patterns
   */
  async detectRequest(requestFingerprint: RequestFingerprint): Promise<DetectionResult> {
    const riskFactors = await this.analyzeRiskFactors(requestFingerprint);
    const detectionScore = this.calculateDetectionScore(riskFactors);
    
    return {
      isDetected: detectionScore > 70,
      confidence: Math.min(100, detectionScore),
      detectedBy: riskFactors.flaggedPatterns,
      riskLevel: this.assessRiskLevel(detectionScore),
      recommendations: this.generateDetectionRecommendations(detectionScore, riskFactors)
    };
  }

  /**
   * Analyze risk factors for bot detection
   */
  private async analyzeRiskFactors(fingerprint: RequestFingerprint): Promise<any> {
    // Check for suspicious patterns
    const suspiciousPatterns = {
      automatedTools: /selenium|webdriver|playwright|puppeteer|cheerio|phantomjs/i,
      inconsistentHeaders: /(?:^$|^curl|wget|python-requests|bot)/i,
      perfectTiming: /\b(ms|s)\b.{0,100}/i, // Exact timing suggests bot
      missingHeaders: /(?:user-agent|accept|accept-language|accept-encoding)/i,
      javascriptDisabled: /(?:javascript\s*:\s*none|noscript)/i,
      headlessMode: /headless|phantom|automation/i
    };

    const detectedPatterns: string[] = [];

    // Analyze each pattern
    Object.entries(suspiciousPatterns).forEach(([pattern, description]) => {
      const regex = new RegExp(pattern, 'gi');
      const matches = this.searchFingerprint(fingerprint, pattern);
      if (matches.length > 0) {
        detectedPatterns.push(`${description}: ${matches.join(', ')}`);
      }
    });

    // Check TLS fingerprint consistency
    const tlsIssues = await this.checkTLSConsistency(fingerprint);

    return {
      suspiciousPatterns: detectedPatterns,
      tlsIssues,
      riskFactors: { suspiciousPatterns, tlsIssues }
    };
  }

  /**
   * Search fingerprint across all fields
   */
  private searchFingerprint(fingerprint: RequestFingerprint, pattern: RegExp): RegExpMatchArray | null {
    try {
      const searchString = pattern.source.replace(/[\/\s]/g, '');
      if (searchString.includes('.')) {
        return null; // Avoid regex injection
      }

      const regex = new RegExp(searchString, 'gi');
      return fingerprint.userAgent?.match(regex) || fingerprint.headers?.match(regex);
    } catch {
      return null;
    }
  }

  /**
   * Check TLS fingerprint consistency
   */
  private async checkTLSConsistency(fingerprint: RequestFingerprint): Promise<string[]> {
    const issues: string[] = [];

    // Check for mismatched TLS JA3 fingerprint
    if (fingerprint.tlsFingerprint && fingerprint.userAgent) {
      const ja3Match = fingerprint.userAgent.includes('JA3');
      const tlsInJA3 = fingerprint.tlsFingerprint.includes('JA3');
      
      if (!ja3Match && tlsInJA3) {
        issues.push('TLS fingerprint present but JA3 not in User-Agent');
      }
    }

    return issues;
  }

  /**
   * Calculate detection score based on risk factors
   */
  private calculateDetectionScore(riskFactors: any): number {
    let score = 0;

    // Suspicious patterns (highest risk)
    if (riskFactors.suspiciousPatterns.length > 0) {
      score += 40;
    }

    // TLS inconsistencies (medium risk)
    if (riskFactors.tlsIssues.length > 0) {
      score += 25;
    }

    // Missing headers (medium risk)
    if (riskFactors.missingHeaders.length > 0) {
      score += 20;
    }

    // Headless mode (high risk)
    if (riskFactors.headlessMode) {
      score += 30;
    }

    // JavaScript disabled (suspicious)
    if (riskFactors.javascriptDisabled) {
      score += 15;
    }

    return score;
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations for avoiding detection
   */
  private generateDetectionRecommendations(score: number, riskFactors: any): string[] {
    const recommendations: string[] = [];

    if (score >= 70) {
      recommendations.push('🚨 High risk of detection - reduce automation frequency');
      recommendations.push('Switch to manual mode for critical applications');
    }

    if (riskFactors.suspiciousPatterns.length > 0) {
      recommendations.push('Remove automation tool references from headers/requests');
      recommendations.push('Use residential proxies and rotate user agents');
    }

    if (riskFactors.tlsIssues.length > 0) {
      recommendations.push('Ensure TLS fingerprint consistency with user agent');
    }

    if (riskFactors.headlessMode) {
      recommendations.push('Consider using full browser automation for high-volume applications');
    }

    recommendations.push('Add random delays between 2-5 seconds');
    recommendations.push('Rotate user agents and browser profiles');
    recommendations.push('Mimic human browsing patterns');

    return recommendations;
  }

  /**
   * Get next available proxy
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxyPool.length === 0) return null;

    // Try healthy proxies first
    const healthyProxies = this.proxyPool.filter(proxy => 
      this.proxyHealthCache.get(proxy.proxyUrl)?.isHealthy ?? true
    );

    if (healthyProxies.length > 0) {
      const proxy = healthyProxies[Math.floor(Math.random() * healthyProxies.length)];
      this.currentProxyIndex = this.proxyPool.indexOf(proxy);
      return proxy;
    }

    // Fallback to least used proxy
    const sortedProxies = this.proxyPool.sort((a, b) => 
      (this.proxyHealthCache.get(b.proxyUrl)?.failureCount || 0) - 
       (this.proxyHealthCache.get(a.proxyUrl)?.failureCount || 0)) -
      (this.proxyHealthCache.get(b.proxyUrl)?.successCount || 0)
    );

    return sortedProxies[0];
  }

  /**
   * Update proxy health metrics
   */
  updateProxyHealth(proxyUrl: string, success: boolean, responseTime: number): void {
    const current = this.proxyHealthCache.get(proxyUrl) || {
      successCount: 0,
      failureCount: 0,
      isHealthy: true,
      lastUsed: new Date()
    };

    current.successCount += success ? 1 : 0;
    current.failureCount += success ? 0 : 1;
    current.lastUsed = new Date();
    current.isHealthy = current.successCount > (current.failureCount * 3);

    this.proxyHealthCache.set(proxyUrl, current);
  }

  /**
   * Simulate human-like delays
   */
  async humanDelay(min: number = 2000, max: number = 5000): Promise<void> {
    const delay = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Execute request with anti-detection measures
   */
  async executeStealthRequest(url: string, options: any = {}): Promise<any> {
    const config: AntiDetectionConfig = {
      minDelay: 2000,
      maxDelay: 5000,
      randomDelayRange: 3000,
      enableProxyRotation: true,
      enableFingerprintRotation: true,
      enableBehavioralSimulation: true,
      rateLimitPerProxy: 10,
      requestsPerMinute: 30,
      stealthOptions: {
        disableWebGlitch: true,
        disableCanvasFingerprint: true,
        disableWebRTC: true,
        disableCSSExtraction: true
      }
    };

    // Get appropriate proxy and browser profile
    const proxy = config.enableProxyRotation ? this.getNextProxy() : null;
    const profile = this.generateBrowserProfile();

    // Execute request with stealth measures
    await this.humanDelay(config.minDelay, config.maxDelay);

    try {
      if (proxy) {
        return this.httpService.get(url, {
          proxy: {
            host: proxy.proxyUrl.split('://')[1],
            port: proxy.proxyCredentials.port || 8080,
            auth: proxy.proxyCredentials
          },
          headers: {
            ...this.generateStealthHeaders(profile),
            'User-Agent': profile.userAgent
          },
          timeout: 30000
        });
      } else {
        return this.httpService.get(url, {
          headers: this.generateStealthHeaders(profile),
          'User-Agent': profile.userAgent,
          timeout: 30000
        });
      }
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Generate stealth headers to avoid detection
   */
  private generateStealthHeaders(profile: BrowserProfile): Record<string, string> {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': profile.language,
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Charset': 'utf-8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Mode': 'navigate',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Connection': 'keep-alive',
      'X-Forwarded-For': String(Math.random()).substring(2, 10) + '.example.com'
    };
  }
}