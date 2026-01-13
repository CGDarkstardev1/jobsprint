/**
 * Cost Tracking & PDF Generation Service
 * Tracks AI usage costs and generates professional PDF documents
 * Integrates with CDP for serverless PDF generation
 */

import { LLMAbstractionLayer } from './llm-abstraction.service';

export interface CostTrackingEntry {
  timestamp: Date;
  service: 'llm' | 'rag' | 'pdf' | 'other';
  provider: string;
  model?: string;
  operation: string;
  cost: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  metadata?: Record<string, any>;
}

export interface CostSummary {
  totalCost: number;
  costByService: Record<string, number>;
  costByProvider: Record<string, number>;
  usageByModel: Record<string, { requests: number; totalTokens: number; totalCost: number }>;
  timeRange: { start: Date; end: Date };
}

export interface PDFGenerationRequest {
  content: string;
  type: 'resume' | 'cover-letter' | 'report';
  style: 'professional' | 'modern' | 'minimal';
  includeHeader?: boolean;
  includeFooter?: boolean;
  customCSS?: string;
}

export interface PDFGenerationResult {
  url: string;
  fileName: string;
  fileSize: number;
  generationTime: number;
  cost: number;
}

export class CostTrackingService {
  private costs: CostTrackingEntry[] = [];
  private readonly COST_THRESHOLDS = {
    daily: 10.0, // $10 per day
    weekly: 50.0, // $50 per week
    monthly: 150.0, // $150 per month
  };

  constructor(private llmService: LLMAbstractionLayer) {}

  trackCost(entry: Omit<CostTrackingEntry, 'timestamp'>): void {
    const costEntry: CostTrackingEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.costs.push(costEntry);

    // Check thresholds and warn if exceeded
    this.checkThresholds(costEntry);
  }

  getCostSummary(startDate?: Date, endDate?: Date): CostSummary {
    const relevantCosts = this.costs.filter((cost) => {
      if (startDate && cost.timestamp < startDate) return false;
      if (endDate && cost.timestamp > endDate) return false;
      return true;
    });

    const costByService: Record<string, number> = {};
    const costByProvider: Record<string, number> = {};
    const usageByModel: Record<
      string,
      { requests: number; totalTokens: number; totalCost: number }
    > = {};

    let totalCost = 0;

    for (const cost of relevantCosts) {
      totalCost += cost.cost;

      // Aggregate by service
      costByService[cost.service] = (costByService[cost.service] || 0) + cost.cost;

      // Aggregate by provider
      costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.cost;

      // Aggregate by model
      if (cost.model) {
        if (!usageByModel[cost.model]) {
          usageByModel[cost.model] = { requests: 0, totalTokens: 0, totalCost: 0 };
        }
        usageByModel[cost.model].requests += 1;
        usageByModel[cost.model].totalCost += cost.cost;
        if (cost.tokens) {
          usageByModel[cost.model].totalTokens += cost.tokens.total;
        }
      }
    }

    return {
      totalCost,
      costByService,
      costByProvider,
      usageByModel,
      timeRange: {
        start: startDate || relevantCosts[0]?.timestamp || new Date(),
        end: endDate || relevantCosts[relevantCosts.length - 1]?.timestamp || new Date(),
      },
    };
  }

  private checkThresholds(newEntry: CostTrackingEntry): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyCosts =
      this.costs.filter((c) => c.timestamp >= today).reduce((sum, c) => sum + c.cost, 0) +
      newEntry.cost;

    const weeklyCosts =
      this.costs.filter((c) => c.timestamp >= weekStart).reduce((sum, c) => sum + c.cost, 0) +
      newEntry.cost;

    const monthlyCosts =
      this.costs.filter((c) => c.timestamp >= monthStart).reduce((sum, c) => sum + c.cost, 0) +
      newEntry.cost;

    if (dailyCosts > this.COST_THRESHOLDS.daily) {
      console.warn(
        `⚠️ Daily cost threshold exceeded: $${dailyCosts.toFixed(2)} (limit: $${this.COST_THRESHOLDS.daily})`
      );
    }

    if (weeklyCosts > this.COST_THRESHOLDS.weekly) {
      console.warn(
        `⚠️ Weekly cost threshold exceeded: $${weeklyCosts.toFixed(2)} (limit: $${this.COST_THRESHOLDS.weekly})`
      );
    }

    if (monthlyCosts > this.COST_THRESHOLDS.monthly) {
      console.warn(
        `⚠️ Monthly cost threshold exceeded: $${monthlyCosts.toFixed(2)} (limit: $${this.COST_THRESHOLDS.monthly})`
      );
    }
  }
}

export class PDFGenerationService {
  constructor(
    private llmService: LLMAbstractionLayer,
    private costTracker: CostTrackingService
  ) {}

  async generatePDF(request: PDFGenerationRequest): Promise<PDFGenerationResult> {
    const startTime = Date.now();

    // Generate HTML from content
    const html = await this.generateHTML(request);

    // Use CDP or external service to generate PDF
    const pdfResult = await this.generatePDFfromHTML(html, request.type);

    const generationTime = Date.now() - startTime;

    // Track cost
    this.costTracker.trackCost({
      service: 'pdf',
      provider: 'cdp-chrome',
      operation: 'generate-pdf',
      cost: 0.01, // Minimal cost for PDF generation
      metadata: {
        type: request.type,
        style: request.style,
        contentLength: request.content.length,
        generationTime,
      },
    });

    return {
      url: pdfResult.url,
      fileName: pdfResult.fileName,
      fileSize: pdfResult.fileSize,
      generationTime,
      cost: 0.01,
    };
  }

  private async generateHTML(request: PDFGenerationRequest): Promise<string> {
    const baseCSS = this.getBaseCSS(request.style);
    const customCSS = request.customCSS || '';

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${request.type.replace('-', ' ').toUpperCase()}</title>
    <style>
${baseCSS}
${customCSS}
    </style>
</head>
<body>
`;

    if (request.includeHeader) {
      html += `<header class="document-header">
        <h1>${request.type === 'resume' ? 'Professional Resume' : request.type === 'cover-letter' ? 'Cover Letter' : 'Document'}</h1>
      </header>`;
    }

    html += `<main class="document-content">
${this.formatContent(request.content, request.type)}
</main>`;

    if (request.includeFooter) {
      html += `<footer class="document-footer">
        <p>Generated by JobSprint AI - ${new Date().toLocaleDateString()}</p>
      </footer>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  private formatContent(content: string, type: string): string {
    // Convert plain text to HTML with proper formatting
    const lines = content.split('\n');
    let html = '';

    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br>';
      } else if (line.startsWith('•') || line.startsWith('-')) {
        html += `<li>${line.substring(1).trim()}</li>`;
      } else if (line.match(/^[A-Z\s]+:$/)) {
        // Section headers
        html += `<h2>${line.replace(':', '')}</h2>`;
      } else {
        html += `<p>${line}</p>`;
      }
    }

    // Wrap list items
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    return html;
  }

  private getBaseCSS(style: string): string {
    const baseStyles = `
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        color: #333;
      }

      .document-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #007acc;
        padding-bottom: 10px;
      }

      .document-header h1 {
        color: #007acc;
        margin: 0;
        font-size: 24px;
      }

      .document-content {
        max-width: 800px;
        margin: 0 auto;
      }

      .document-content h2 {
        color: #007acc;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-top: 25px;
        margin-bottom: 15px;
        font-size: 18px;
      }

      .document-content p {
        margin: 10px 0;
      }

      .document-content ul {
        margin: 10px 0;
        padding-left: 20px;
      }

      .document-content li {
        margin: 5px 0;
      }

      .document-footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        color: #666;
        font-size: 12px;
      }
    `;

    const styleVariants = {
      professional: `
        body { font-family: 'Times New Roman', serif; }
        .document-header h1 { color: #000; }
        .document-content h2 { color: #000; border-bottom-color: #000; }
      `,
      modern: `
        body { font-family: 'Helvetica', sans-serif; }
        .document-header { border-bottom-color: #ff6b6b; }
        .document-header h1 { color: #ff6b6b; }
        .document-content h2 { color: #ff6b6b; border-bottom-color: #ff6b6b; }
      `,
      minimal: `
        body { font-family: 'Arial', sans-serif; color: #555; }
        .document-header { border: none; }
        .document-content h2 { border: none; font-weight: normal; }
      `,
    };

    return baseStyles + (styleVariants[style as keyof typeof styleVariants] || '');
  }

  private async generatePDFfromHTML(
    html: string,
    type: string
  ): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
  }> {
    // In a real implementation, this would use Puppeteer/CDP or a service like PDF-lib
    // For now, we'll simulate the PDF generation

    const fileName = `${type}-${Date.now()}.pdf`;

    // Simulate PDF generation delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      url: `https://storage.example.com/pdfs/${fileName}`,
      fileName,
      fileSize: Math.floor(html.length * 0.8), // Rough estimation
    };
  }
}

// Combined service for easy integration
export class DocumentGenerationService {
  constructor(
    private llmService: LLMAbstractionLayer,
    private costTracker: CostTrackingService,
    private pdfService: PDFGenerationService
  ) {}

  getCostTracker(): CostTrackingService {
    return this.costTracker;
  }

  getPDFService(): PDFGenerationService {
    return this.pdfService;
  }

  async generateDocument(
    content: string,
    type: 'resume' | 'cover-letter',
    options: {
      style?: 'professional' | 'modern' | 'minimal';
      includePDF?: boolean;
      trackCosts?: boolean;
    } = {}
  ): Promise<{
    content: string;
    pdf?: PDFGenerationResult;
    costSummary?: CostSummary;
  }> {
    const result: any = { content };

    if (options.includePDF) {
      const pdfRequest: PDFGenerationRequest = {
        content,
        type,
        style: options.style || 'professional',
        includeHeader: true,
        includeFooter: true,
      };

      result.pdf = await this.pdfService.generatePDF(pdfRequest);
    }

    if (options.trackCosts) {
      result.costSummary = this.costTracker.getCostSummary();
    }

    return result;
  }
}
