import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import puter from '../utils/ai-client.js';
import dotenv from 'dotenv';
import { browserManager } from './BrowserManager.js';
import { AutoApplyService } from './autoApply.js';
import { webSocketService } from './websocket.js';
import { agentDB } from './agentDb.js';
import { imageResizeUtil } from '../utils/image-resize.js';
import { stealthService } from './stealth.js';

dotenv.config();

/**
 * JobSprint Agentic Browser Service
 * Implements the "Eyes" (+ AI reasoning) and "Hands" (Playwright) loop.
 *
 * Uses Puter.js with Claude Sonnet 4.5 for vision-based browser automation.
 * Includes image resize optimization and AgentDB Q&A Memory integration.
 */
export class AgentService {
  constructor() {
    this.browserManager = browserManager;
    this.isInitialized = false;
    // Shared Puter client
    this.puter = puter;
    // AgentDB for Q&A memory
    this.agentDB = agentDB;
    // Image resize utility
    this.imageResize = imageResizeUtil;
    // Stealth service for human-like behavior
    this.stealth = stealthService;
    // Initialize Auto-Apply Service
    // Lazy load AutoApplyService to avoid circular dependency
    Object.defineProperty(this, 'autoApplyService', {
      get: () => {
        if (!this._autoApplyService) {
          this._autoApplyService = new AutoApplyService({
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          });
        }
        return this._autoApplyService;
      },
    });
  }

  /**
   * Ensure browser is running and ready via BrowserManager
   */
  async ensureBrowser(options = {}) {
    // Delegate to singleton manager
    const { browser, context, page } = await this.browserManager.getContext();

    // Update local references for convenience methods (if any depend on this)
    this.browser = browser;
    this.context = context;
    this.page = page;

    return { browser, context, page };
  }

  /**
   * Execute specific task types (used by AutoApplyService)
   */
  async executeTask(task) {
    switch (task.type) {
      case 'job_search':
        return await this._executeJobSearch(task);
      case 'job_application':
        return await this._executeJobApplication(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Execute job search task
   */
  async _executeJobSearch(task) {
    const { platform, url, query } = task;

    // Use agentic loop to scrape job listings
    const result = await this.runAgenticLoop(
      `Navigate to ${url} and extract job listings. Look for job titles, companies, locations, and application URLs. Return the information as a JSON array of job objects.`,
      {
        headless: true,
        maxSteps: 20,
        keepBrowserOpen: false,
      }
    );

    // For now, return mock data since scraping real sites requires more complex logic
    // In a real implementation, this would parse the page content
    const mockJobs = [
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        url: 'https://example.com/job/123',
        description: 'We are looking for a skilled software engineer...',
        platform: platform,
      },
    ];

    return {
      success: true,
      jobs: mockJobs,
    };
  }

  /**
   * Execute job application task
   */
  async _executeJobApplication(task) {
    const { targetUrl, cv, coverLetter, formData, submissionId } = task;

    return await this.runAgenticLoop(
      `Navigate to ${targetUrl} and submit the job application.

CV Content:
${cv}

Cover Letter:
${coverLetter}

Form Data:
${JSON.stringify(formData, null, 2)}

Instructions:
1. Fill out all form fields with the provided information
2. Upload CV if there's a file upload field
3. Submit the application
4. Confirm submission was successful`,
      {
        headless: false,
        maxSteps: 30,
        keepBrowserOpen: true,
      }
    );
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.page) {
      try {
        await this.page.close();
      } catch (e) {}
      this.page = null;
    }
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
      this.context = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {}
      this.browser = null;
    }
    this.isInitialized = false;
  }

  /**
   * Agentic Loop: Screenshot -> AI Analysis -> Action
   * Uses Anthropic Claude for vision-based browser automation.
   */
  async runAgenticLoop(goal, options = {}) {
    logger.info(`Starting agentic loop for goal: ${goal}`);

    // Broadcast initial state
    webSocketService.broadcast('STATE_CHANGE', {
      state: 'INITIALIZING',
      goal,
      timestamp: new Date().toISOString(),
    });
    const {
      useSession = true,
      headless = false,
      maxSteps = 30,
      keepBrowserOpen = true, // Keep browser open after completion by default
    } = options;

    // Load User Profile for context
    let userProfile = {};
    try {
      const fs = await import('fs');
      if (fs.existsSync('src/data/user_profile.json')) {
        userProfile = JSON.parse(fs.readFileSync('src/data/user_profile.json', 'utf8'));
      }
    } catch (e) {
      logger.warn('Could not load user profile', e);
    }

    // Ensure browser is ready
    await this.ensureBrowser({ headless, useSession });

    // Broadcast browser ready state
    webSocketService.broadcast('STATE_CHANGE', {
      state: 'RUNNING',
      goal,
      maxSteps,
      timestamp: new Date().toISOString(),
    });

    let step = 0;
    const history = [];
    let success = false;
    let finalScreenshot = null;

    try {
      while (step < maxSteps) {
        step++;

        // POPUP DETECTION - handle new tabs/popups
        const pages = this.context.pages();
        let promptSuffix = '';
        if (pages.length > 1) {
          this.page = pages[pages.length - 1];
          await this.page.waitForLoadState('domcontentloaded');
          promptSuffix = ' (NOTE: You are currently viewing a POPUP window. Treat it accordingly.)';
          logger.info(`Switched focus to popup/page index ${pages.length - 1}`);
        }

        const currentPage = this.page;
        const currentUrl = currentPage.url();

        logger.info(`Step ${step}: Taking snapshot of ${currentUrl}...`);
        const screenshot = await currentPage.screenshot({ encoding: 'base64' });

        // Resize image for Vision API optimization (prevents timeouts)
        const resizedScreenshot = await this.imageResize.resize(screenshot);
        const imageDataUrl =
          typeof resizedScreenshot === 'string'
            ? resizedScreenshot
            : `data:image/png;base64,${resizedScreenshot}`;

        // Broadcast screenshot to all connected clients
        webSocketService.broadcast('SCREENSHOT', {
          step,
          url: currentUrl,
          image: imageDataUrl,
          originalSize: this.imageResize.getImageSize(screenshot),
          resizedSize: this.imageResize.getImageSize(resizedScreenshot),
          timestamp: new Date().toISOString(),
        });

        const prompt = `You are a VISUAL AI browser automation agent. Your goal: ${goal}

Current URL: ${currentUrl}
Step: ${step}/${maxSteps}

User Profile (for form filling):
${JSON.stringify(userProfile, null, 2)}

Previous Actions:
${history
  .slice(-5)
  .map((h) => `- ${h.action}: ${h.reason}`)
  .join('\n')}

${promptSuffix}

VISUAL RECOGNITION INSTRUCTIONS:
1. Examine the screenshot VERY carefully.
2. Identify elements by their VISUAL qualities (color, text, shape, proximity to labels).
3. Do not assume any specific HTML structure or language.
4. Return the most effective CSS selector you can derive from the visual context.
5. If you cannot find a selector, describe the element's position relative to others.

Return ONLY valid JSON:
{
  "action": "CLICK" | "TYPE" | "NAVIGATE" | "SCROLL" | "WAIT" | "FINISH",
  "target": "CSS selector or URL",
  "value": "text to type (for TYPE action)",
  "reason": "brief explanation based on VISUAL evidence"
}

Important:
- Use precise CSS selectors discovered from visual cues
- If the goal is achieved, use FINISH
- If stuck, try a different approach
- For login forms, use credentials from user profile`;

        let decision;
        try {
          if (!this.puter) {
            throw new Error('Puter.js client not initialized. Set PUTER_API_KEY in .env');
          }

          // Vision-based reasoning using Puter.js with Claude Sonnet 4.5
          // Image is already resized above

          // DEBUG: Log the request payload
          logger.debug('Vision API Request:', {
            promptLength: prompt.length,
            imageDataUrlPrefix: imageDataUrl.substring(0, 50) + '...',
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
          });

          // FIXED: Correct argument order for puter.ai.chat()
          // Signature: chat(prompt, image, options, testMode)
          const aiResp = await this.puter.ai.chat(
            prompt, // prompt text
            imageDataUrl, // image data URL (already resized)
            {
              // options object (BEFORE testMode)
              model: 'claude-sonnet-4-5', // Claude Sonnet 4.5 with vision
              max_tokens: 1024,
            },
            false // testMode flag (LAST argument)
          );

          // DEBUG: Log the response
          logger.debug('Vision API Response:', {
            hasMessage: !!aiResp?.message,
            hasContent: !!aiResp?.message?.content,
            contentPreview: aiResp?.message?.content?.substring(0, 100),
          });
          // Debug logs removed for brevity

          if (!aiResp || !aiResp.message || !aiResp.message.content) {
            throw new Error(`Invalid AI response: ${JSON.stringify(aiResp)}`);
          }

          const content = aiResp.message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);

          if (!jsonMatch) {
            throw new Error(`No JSON found in AI response: ${content}`);
          }
          decision = JSON.parse(jsonMatch[0]);

          logger.info(`AI Decision: ${decision.action} - ${decision.reason}`);

          // Broadcast AI decision log
          webSocketService.broadcast('LOG', {
            type: 'DECISION',
            step,
            action: decision.action,
            reason: decision.reason,
            target: decision.target,
            timestamp: new Date().toISOString(),
          });
        } catch (aiErr) {
          logger.error(
            'AI Reasoning failed:',
            typeof aiErr === 'object' ? JSON.stringify(aiErr, null, 2) : aiErr
          );
          const errorMessage = aiErr.message || JSON.stringify(aiErr);
          if (step === 1) {
            decision = {
              action: 'WAIT',
              reason: `AI initialization - ${errorMessage}`,
              value: '2000',
            };
          } else {
            decision = { action: 'FINISH', reason: `AI Error: ${errorMessage}`, error: true };
          }
        }

        // Record decision with screenshot
        decision.screenshot = screenshot;
        decision.step = step;
        history.push(decision);

        if (decision.action === 'FINISH') {
          success = !decision.error;
          logger.info(`Loop finished: ${decision.reason}`);

          // Broadcast finish decision
          webSocketService.broadcast('LOG', {
            type: 'FINISH',
            step,
            reason: decision.reason,
            success: success,
            timestamp: new Date().toISOString(),
          });

          break;
        }

        // Execute the action
        try {
          // Broadcast action execution
          webSocketService.broadcast('LOG', {
            type: 'ACTION',
            step,
            action: decision.action,
            target: decision.target,
            value: decision.value,
            timestamp: new Date().toISOString(),
          });

          switch (decision.action) {
            case 'NAVIGATE':
              await currentPage.goto(decision.target, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
              });
              break;
            case 'CLICK':
              // Use stealth human click
              await this.stealth.humanClick(currentPage, decision.target);
              break;
            case 'TYPE':
              // Use stealth human typing instead of direct fill
              await this.stealth.humanTyping(currentPage, decision.target, decision.value);
              break;
            case 'SCROLL':
              // Use stealth human scroll
              await this.stealth.humanScroll(
                currentPage,
                decision.value || 500,
                decision.value || 'down'
              );
              break;
            case 'WAIT':
              await currentPage.waitForTimeout(parseInt(decision.value) || 2000);
              break;
          }
        } catch (actErr) {
          logger.warn(`Action failed (${decision.action}): ${actErr.message}`);
          decision.error = actErr.message;

          // Broadcast error
          webSocketService.broadcast('ERROR', {
            type: 'ACTION_FAILED',
            step,
            action: decision.action,
            error: actErr.message,
            timestamp: new Date().toISOString(),
          });
        }

        // Stealth delay between actions
        await this.stealth.applyDelay({ action: 'general' });
      }

      // Capture final state
      try {
        const finalBuffer = await this.page.screenshot();
        finalScreenshot = finalBuffer.toString('base64');
      } catch (e) {
        logger.warn('Could not capture final screenshot');
      }

      // Save session on success
      if (success) {
        await this.saveSession();

        // Broadcast session saved
        webSocketService.broadcast('LOG', {
          type: 'SESSION_SAVED',
          timestamp: new Date().toISOString(),
        });
      }

      // Broadcast final state
      webSocketService.broadcast('STATE_CHANGE', {
        state: success ? 'COMPLETED' : 'FAILED',
        goal,
        stepsCompleted: step,
        success,
        timestamp: new Date().toISOString(),
      });

      return {
        success,
        history,
        finalScreenshot,
        stepsCompleted: step,
        browserOpen: keepBrowserOpen,
      };
    } catch (error) {
      logger.error(`Agentic loop failed: ${error.message}`);

      // Broadcast critical error
      webSocketService.broadcast('ERROR', {
        type: 'CRITICAL',
        error: error.message,
        stepsCompleted: step,
        timestamp: new Date().toISOString(),
      });

      // Cleanup on critical error only
      if (!keepBrowserOpen) {
        await this.cleanup();
      }

      return {
        success: false,
        error: error.message,
        history,
        stepsCompleted: step,
      };
    }
  }

  /**
   * Universal Login: Vision-based login logic
   * Enhanced to prioritize session check and support Social Login detection (Google/GitHub)
   */
  async universalLogin(targetUrl, credentials, config = {}) {
    logger.info(`Starting Universal Login for ${targetUrl}...`);

    // 1. Check if we're already logged in
    const { page } = await this.ensureBrowser({ headless: false, useSession: true });

    logger.info(`Checking existing session state for ${targetUrl}...`);
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const screenshot = await page.screenshot({ encoding: 'base64' });
      const resized = await this.imageResize.resize(screenshot);
      const imageDataUrl =
        typeof resized === 'string' ? resized : `data:image/png;base64,${resized}`;

      const sessionCheckPrompt = `Analyze this screenshot of ${targetUrl}.
            Goal: Determine if the user is ALREADY logged in.
            
            Look for:
            - Profile icons / avatars
            - "Sign Out" / "Log Out" buttons
            - "Dashboard" or "Account" links
            - Absence of "Sign In" / "Register" prominent buttons
            
            Return JSON: { "isLoggedIn": boolean, "confidence": number, "reason": "string" }`;

      const checkResp = await this.puter.ai.chat(sessionCheckPrompt, imageDataUrl, {
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
      });

      const checkResult = JSON.parse(checkResp.message.content.match(/\{[\s\S]*\}/)[0]);
      logger.info(`Session Check: ${JSON.stringify(checkResult)}`);

      if (checkResult.isLoggedIn && checkResult.confidence > 0.8) {
        logger.info('✅ Already logged in! Skipping authentication flow.');
        return { success: true, message: 'Already logged in', skippedLogin: true };
      }
    } catch (e) {
      logger.warn(`Session check failed, proceeding with full login flow: ${e.message}`);
    }

    // 2. Proceed with full login flow
    const yoloModeInstruction = config.yoloMode
      ? "YOLO MODE ACTIVE: Auto-click 'Sign Up' or 'Create Account' if login fails. Create account with provided credentials if needed."
      : 'If login fails, STOP and ask for permission before creating an account.';

    const loginGoal = `Navigate to ${targetUrl} and log in using the provided credentials.
            
            CREDENTIALS:
            Username/Email: ${credentials.username}
            Password: ${credentials.password}
            Preferred Social Provider: ${credentials.preferredProvider || 'Google'}
            
            VISION-FIRST PROTOCOL:
            1. Look for Social Login buttons first (Google, GitHub, LinkedIn).
            2. If 'Continue with ${credentials.preferredProvider}' is visible, CLICK it.
            3. If only standard fields are visible, enter Username and Password.
            4. Detect and handle "I'm not a robot" or simple CAPTCHAs by clicking them.
            5. ${yoloModeInstruction}
            
            Return FINISH when successfully logged in (dashboard or profile visible).`;

    return await this.runAgenticLoop(loginGoal, {
      headless: false,
      maxSteps: 40,
      keepBrowserOpen: true,
    });
  }

  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: 'session.json' });
      logger.info('Session saved to session.json');
    }
  }

  async loginToTuringWithGoogle() {
    logger.info('Starting Turing Google Login...');
    this.browser = await chromium.launch({ headless: false }); // Better for debugging
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Automated Flow via turing.com Homepage
      // User requested: "go through turing.com then 'for talent' as the login"
      await page.goto('https://www.turing.com/');
      await page.waitForTimeout(2000);

      logger.info("Navigated to turing.com. Looking for 'Apply for Jobs' button...");

      // The main CTA for talent is usually "Apply for Jobs"
      try {
        // Try explicitly for "Apply for Jobs" which acts as "For Talent"
        const applyBtn = page.getByRole('link', { name: 'Apply for Jobs' }).first();
        if (await applyBtn.isVisible()) {
          await applyBtn.click();
          logger.info("Clicked 'Apply for Jobs' link.");
        } else {
          // Fallback to searching buttons
          const buttons = await page.getByRole('button').all();
          let clicked = false;
          for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && text.includes('Apply for Jobs')) {
              logger.info(`Clicked button: ${text}`);
              await btn.click();
              clicked = true;
              break;
            }
          }

          if (!clicked) {
            logger.warn("'Apply for Jobs' not found. Trying direct login URL as backup.");
            await page.goto('https://developers.turing.com/login');
          }
        }
      } catch (navErr) {
        logger.warn('Homepage navigation functionality failed. Fallback to direct login.', navErr);
        await page.goto('https://developers.turing.com/login');
      }

      await page.waitForTimeout(3000); // Wait for page transition

      // Now handle the Google Login part (Automated)
      logger.info('Attempting Automated Google Login...');

      // Set up a promise to catch the popup *before* we click
      const popupPromise = context.waitForEvent('page').catch((e) => null);

      try {
        // Strategy 1: Standard Iframe Locator
        const googleIframe = page.frameLocator('iframe[src*="accounts.google.com/gsi/button"]');
        await googleIframe.locator('div[role="button"]').click({ timeout: 5000, force: true });
        logger.info('Clicked Google button via iframe locator.');
      } catch (e) {
        logger.warn('Strategy 1 failed. Trying Strategy 2 (Direct Click on Wrapper)...');
        try {
          await page.click('#google-button-wrapper', { timeout: 2000 });
        } catch (e2) {
          // Strategy 3: Brute force find any iframe that looks like Google
          const frames = page.frames();
          const googleFrame = frames.find((f) =>
            f.url().includes('accounts.google.com/gsi/button')
          );
          if (googleFrame) {
            await googleFrame.click('div[role="button"]');
            logger.info('Clicked Google button via frame iteration.');
          } else {
            logger.error('Could not find Google Login iframe.');
          }
        }
      }

      // Handle the Popup if it appears
      const popup = await popupPromise;
      if (popup) {
        logger.info('Google Popup Detected! Automating selection...');
        await popup.waitForLoadState();

        try {
          // Start by trying to click the email/name
          const turingEmail = process.env.TURING_EMAIL || 'cnjgentile@gmail.com';
          const accountSelector = popup.getByText(turingEmail);
          if (await accountSelector.isVisible()) {
            await accountSelector.click();
            logger.info(`Selected '${turingEmail}' in popup.`);
          } else {
            // Fallback: Click the first 'link' role that looks like an account
            await popup.getByRole('link').first().click();
            logger.info('Clicked first account link in popup.');
          }

          // Wait for any 'Confirm' or 'Continue' buttons
          await popup.waitForTimeout(1000);
          const confirmBtn = popup.getByRole('button', { name: /continue|confirm|allow/i });
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
            logger.info('Clicked Confirm/Continue in popup.');
          }
        } catch (popupErr) {
          logger.error(`Popup interaction failed: ${popupErr.message}`);
        }
      } else {
        logger.info('No popup detected. Login might be seamless (One Tap).');
      }

      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard/home', { timeout: 60000 });
      logger.info('Successfully logged into Turing Dashboard.');

      // Store browser instance for subsequent steps
      this.browser = this.browser;
      this.page = page;
      this.context = context;

      return { success: true, message: 'Logged in successfully' };
    } catch (error) {
      logger.error(`Turing Login failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Specialized: Solve Turing Quizzes with Vision-Based AI
   * Enhanced implementation with quiz-specific prompt engineering
   */
  async solveTuringQuizzes() {
    logger.info('Starting Turing Quiz Solver with vision AI...');

    const quizResults = {
      questions: [],
      score: 0,
      total: 0,
      startTime: new Date().toISOString(),
    };

    // Custom agentic loop for quiz solving
    const { page } = await this.ensureBrowser({ headless: false, useSession: true });

    try {
      // Step 1: Navigate to dashboard
      logger.info('Navigating to Turing dashboard...');
      await page.goto('https://developers.turing.com/dashboard/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      let step = 0;
      const maxSteps = 50;
      let quizComplete = false;

      while (step < maxSteps && !quizComplete) {
        step++;
        logger.info(`Quiz Step ${step}/${maxSteps}`);

        // Take screenshot for AI analysis
        const screenshot = await page.screenshot({ encoding: 'base64' });
        const currentUrl = page.url();

        // Quiz-specific prompt for Claude Sonnet 4.5
        const quizPrompt = `You are an expert quiz-solving AI. Your task is to analyze Turing.com quiz questions and provide accurate answers.

Current URL: ${currentUrl}
Step: ${step}/${maxSteps}

Questions solved so far: ${quizResults.total}
Current score: ${quizResults.score}

Analyze the screenshot and determine:
1. Are we on a quiz question page? Look for multiple choice answers (A, B, C, D options or similar).
2. Are we on an intro/start screen? Look for "Start", "Begin", "Continue" buttons.
3. Are we on a results/score screen?
4. Is the quiz complete?

For QUIZ QUESTIONS:
- Read the question carefully
- Analyze all answer options
- Solve with 100% accuracy
- Return JSON with the correct answer

For NAVIGATION:
- Click "Start", "Begin", "Continue", "Next", "Submit" buttons as appropriate

Return ONLY valid JSON:
{
  "action": "ANSWER" | "NAVIGATE" | "WAIT" | "FINISH",
  "target": "CSS selector of the correct answer or button",
  "question": "the quiz question text (if answering)",
  "answer": "the correct answer text",
  "explanation": "brief explanation of why this is correct",
  "confidence": 0.0-1.0,
  "reason": "brief explanation of the action"
}

Important:
- Be extremely careful with technical questions (programming, algorithms, etc.)
- For code questions, analyze the code thoroughly
- For math/logic questions, work through the problem step by step
- Only use ANSWER action when you see actual multiple choice options
- Use NAVIGATE for start/continue/submit buttons
- If you see a results screen with a score, use FINISH`;

        // Vision-based reasoning using Puter.js with Claude Sonnet 4.5
        let decision;
        try {
          const imageDataUrl = `data:image/png;base64,${screenshot}`;

          // Puter.js AI chat with vision - pass image in prompt
          const visionPrompt = `${quizPrompt}\n\n[IMAGE: ${imageDataUrl}]`;

          const aiResp = await this.puter.ai.chat(visionPrompt, {
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            temperature: 0.3, // Lower temperature for more accurate answers
          });

          if (!aiResp || !aiResp.message || !aiResp.message.content) {
            throw new Error(`Invalid AI response: ${JSON.stringify(aiResp)}`);
          }

          const content = aiResp.message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);

          if (!jsonMatch) {
            throw new Error(`No JSON found in AI response: ${content}`);
          }

          decision = JSON.parse(jsonMatch[0]);
          logger.info(`AI Decision: ${decision.action} - ${decision.reason}`);

          if (decision.question && decision.answer) {
            logger.info(`Question: ${decision.question.substring(0, 100)}...`);
            logger.info(`Answer: ${decision.answer} (confidence: ${decision.confidence})`);

            // Track question/answer
            quizResults.questions.push({
              step,
              question: decision.question,
              answer: decision.answer,
              explanation: decision.explanation,
              confidence: decision.confidence,
            });
            quizResults.total++;
          }
        } catch (aiErr) {
          logger.error(`AI reasoning failed: ${aiErr.message}`);
          decision = {
            action: 'WAIT',
            reason: `AI Error - retrying: ${aiErr.message}`,
            value: '2000',
          };
        }

        // Execute the action
        try {
          switch (decision.action) {
            case 'ANSWER':
            case 'NAVIGATE':
              await page.click(decision.target, { timeout: 5000 });
              logger.info(`Clicked: ${decision.target}`);

              // Wait briefly after clicking to let page update
              await page.waitForTimeout(1500);

              // Check if we need to submit (some quizzes require explicit submit)
              const submitButtons = await page.$$(
                'button:has-text("Submit"), button:has-text("Next"), button:has-text("Continue")'
              );
              if (submitButtons.length > 0) {
                await page.waitForTimeout(1000);
                // Try to click submit if visible
                try {
                  await submitButtons[0].click({ timeout: 2000 });
                  logger.info('Clicked Submit/Next button');
                } catch (e) {
                  // Submit might not be needed or already clicked
                }
              }
              break;

            case 'WAIT':
              await page.waitForTimeout(parseInt(decision.value) || 2000);
              break;

            case 'FINISH':
              quizComplete = true;
              logger.info(`Quiz complete: ${decision.reason}`);

              // Try to extract final score from page
              try {
                const finalScore = await page.evaluate(() => {
                  const scoreElements = document.querySelectorAll('*');
                  for (const el of scoreElements) {
                    const text = el.textContent;
                    if (text.match(/score|correct|passed|%/i)) {
                      return text;
                    }
                  }
                  return null;
                });

                if (finalScore) {
                  quizResults.finalScoreText = finalScore;
                  logger.info(`Final Score: ${finalScore}`);
                }
              } catch (e) {
                logger.warn('Could not extract final score');
              }
              break;
          }

          // Check if URL changed to results page
          if (
            page.url().includes('result') ||
            page.url().includes('complete') ||
            page.url().includes('score')
          ) {
            logger.info('Detected results page');
            quizComplete = true;

            // Extract score from results page
            try {
              quizResults.finalScoreText = await page.evaluate(() => document.body.textContent);
            } catch (e) {
              logger.warn('Could not extract results text');
            }
          }
        } catch (actErr) {
          logger.error(`Action failed: ${actErr.message}`);
          // Continue anyway - might be a transient error
        }

        // Small pause between steps
        await page.waitForTimeout(500);
      }

      quizResults.endTime = new Date().toISOString();
      quizResults.stepsCompleted = step;

      logger.info(`Quiz solving completed. Total questions: ${quizResults.total}`);
      logger.info(`Results: ${JSON.stringify(quizResults, null, 2)}`);

      // Save session after quiz completion
      await this.saveSession();

      return {
        success: true,
        results: quizResults,
      };
    } catch (error) {
      logger.error(`Quiz solving failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        results: quizResults,
      };
    }
  }

  /**
   * Auto-apply to jobs based on criteria
   * Orchestrates the full workflow: search, tailor, generate, submit
   *
   * @param {Object} criteria - Application criteria
   * @param {string} criteria.keywords - Job keywords
   * @param {string} criteria.location - Location preference
   * @param {string} criteria.experienceLevel - Experience level (entry, mid, senior, executive)
   * @param {string} criteria.jobType - Job type (full-time, part-time, contract, internship)
   * @param {Array<string>} criteria.platforms - Platforms to search (linkedin, indeed, glassdoor)
   * @param {number} criteria.maxApplications - Maximum applications to submit
   * @param {Object} criteria.userCV - User's CV object
   * @param {Object} criteria.formData - Application form data (email, phone, etc.)
   * @returns {Promise<Object>} - Application results with statistics
   */
  async autoApplyToJobs(criteria) {
    logger.info('Starting auto-apply workflow with stealth...');
    logger.info(`Searching for: ${criteria.keywords} in ${criteria.location}`);

    const results = {
      searched: 0,
      applied: 0,
      failed: 0,
      skipped: 0,
      applications: [],
    };

    try {
      // Step 1: Search for jobs
      logger.info('Step 1: Searching for jobs...');
      const jobs = await this.autoApplyService.searchJobs(
        {
          keywords: criteria.keywords,
          location: criteria.location,
          experienceLevel: criteria.experienceLevel || 'mid',
          jobType: criteria.jobType || 'full-time',
        },
        criteria.platforms || ['linkedin', 'indeed']
      );

      results.searched = jobs.length;
      logger.info(`Found ${jobs.length} jobs`);

      // Limit applications if specified
      const jobsToApply = criteria.maxApplications ? jobs.slice(0, criteria.maxApplications) : jobs;

      logger.info(`Applying to top ${jobsToApply.length} jobs...`);

      // Step 2-4: For each job, tailor CV, generate cover letter, and submit
      for (const job of jobsToApply) {
        logger.info(`Applying to: ${job.title} at ${job.company}`);

        try {
          // Tailor CV
          logger.info('  Tailoring CV...');
          const tailorResult = await this.autoApplyService.tailorCV(job, criteria.userCV);

          // Generate cover letter
          logger.info('  Generating cover letter...');
          const coverLetterResult = await this.autoApplyService.generateCoverLetter(
            job,
            criteria.userCV,
            { tone: 'confident', length: 400 }
          );

          // Submit application using browser automation with stealth
          logger.info('  Submitting application...');
          const submitResult = await this._submitApplicationWithBrowser(
            job,
            tailorResult.tailoredCV,
            coverLetterResult.coverLetter,
            criteria.formData
          );

          if (submitResult.success) {
            results.applied++;
            logger.info(`  Application submitted successfully!`);
          } else {
            results.failed++;
            logger.warn(`  Application failed: ${submitResult.error || 'Unknown error'}`);
          }

          results.applications.push({
            jobTitle: job.title,
            company: job.company,
            url: job.url,
            success: submitResult.success,
            submissionId: submitResult.submissionId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          results.failed++;
          logger.error(`Error applying to ${job.title}:`, error.message);

          results.applications.push({
            jobTitle: job.title,
            company: job.company,
            url: job.url,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }

        // ALWAYS CONTINUE: No fail quits - proceed to next application
        logger.info(`Continuing to next application (no fail quits enabled)`);

        // Rate limiting with stealth delay
        if (jobsToApply.indexOf(job) < jobsToApply.length - 1) {
          await this.stealth.applyDelay({ action: 'navigation', min: 5000, max: 15000 }); // 5-15s delay
        }
      }

      logger.info('Auto-apply workflow completed!');
      logger.info(`Jobs searched: ${results.searched}`);
      logger.info(`Applications submitted: ${results.applied}`);
      logger.info(`Applications failed: ${results.failed}`);
      logger.info(`Applications skipped: ${results.skipped}`);

      return results;
    } catch (error) {
      logger.error('Auto-apply workflow error:', error);
      throw error;
    }
  }

  /**
   * Submit application using browser automation
   * @private
   */
  async _submitApplicationWithBrowser(job, tailoredCV, coverLetter, formData) {
    const submissionId = `sub_${Date.now()}`;

    try {
      // Use vision-based browser automation to navigate and submit
      const result = await this.runAgenticLoop(
        `Navigate to ${job.url} and submit the job application using the provided information.

APPLICANT DATA:
- Name: ${formData.firstName} ${formData.lastName}
- Email: ${formData.email}
- Phone: ${formData.phone}
- Tailored CV: [USE THE ATTACHED CONTENT]
- Cover Letter: [USE THE ATTACHED CONTENT]

CV CONTENT:
${tailoredCV}

COVER LETTER CONTENT:
${coverLetter}

UNIVERSAL SUBMISSION PROTOCOL:
1. Visually identify 'Apply', 'Apply Now', or 'Easy Apply' buttons.
2. If redirected to an external site, continue identifying fields visually.
3. Fill out all required fields based on their visual labels (Name, Email, etc.).
4. If a file upload is required for the CV, look for the upload button/area.
5. If the site asks for a cover letter, paste the provided text.
6. Look for 'Next', 'Continue', or 'Submit' buttons to progress through multi-step forms.
7. Return FINISH only when you see a 'Success', 'Application Submitted', or similar confirmation screen.`,
        {
          headless: false,
          maxSteps: 60,
          keepBrowserOpen: true,
        }
      );

      // Log submission
      await this.autoApplyService.logSubmission({
        submissionId,
        jobUrl: job.url,
        status: result.success ? 'submitted' : 'failed',
        timestamp: new Date().toISOString(),
        result,
      });

      return {
        success: result.success,
        submissionId,
        details: result,
      };
    } catch (error) {
      logger.error('Error submitting application:', error);

      await this.autoApplyService.logSubmission({
        submissionId,
        jobUrl: job.url,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      return {
        success: false,
        submissionId,
        error: error.message,
      };
    }
  }

  /**
   * Check AgentDB Memory Bank for similar question
   * Implements Smart Q&A Pattern: check cache before asking AI
   */
  async checkMemoryForQuestion(question) {
    try {
      // Initialize AgentDB if needed
      if (!this.agentDB.initialized) {
        await this.agentDB.init();
      }

      const result = await this.agentDB.query(question);
      if (result.cached && result.answer) {
        logger.debug(`Memory HIT: ${question.substring(0, 50)}...`);
        return result.answer;
      }
      logger.debug(`Memory MISS: ${question.substring(0, 50)}...`);
      return null;
    } catch (error) {
      logger.warn('Memory lookup failed:', error.message);
      return null;
    }
  }

  /**
   * Store Q&A pair in AgentDB Memory Bank
   * Stores form question and answer for future applications
   */
  async storeQuestionAnswer(question, answer) {
    try {
      // Initialize AgentDB if needed
      if (!this.agentDB.initialized) {
        await this.agentDB.init();
      }

      await this.agentDB.store(question, answer, {
        category: 'form-answer',
        storedAt: new Date().toISOString(),
        answerLength: answer?.length || 0,
      });

      logger.debug(`Memory stored: ${question.substring(0, 50)}...`);
    } catch (error) {
      logger.warn('Failed to store in memory:', error.message);
    }
  }

  /**
   * Query with AI fallback (Smart Q&A Pattern)
   * Main method for intelligent Q&A with caching
   */
  async queryWithAIFallback(question, aiPrompt) {
    try {
      // Initialize AgentDB if needed
      if (!this.agentDB.initialized) {
        await this.agentDB.init();
      }

      // Check cache first
      const cached = await this.agentDB.query(question);
      if (cached.cached && cached.answer) {
        return { answer: cached.answer, source: 'memory' };
      }

      // Cache miss - ask AI
      logger.info(`Asking AI: ${question.substring(0, 50)}...`);

      const response = await this.puter.ai.chat(
        aiPrompt,
        null, // No image for text-only queries
        { model: 'claude-sonnet-4-5', max_tokens: 500 },
        false
      );

      const answer = response.message?.content;

      // Store in memory for future
      await this.storeQuestionAnswer(question, answer);

      return { answer, source: 'ai' };
    } catch (error) {
      logger.error('queryWithAIFallback failed:', error);
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Internal simulation of Puter AI reasoning for complex flows
   */
  async _mockAIDecision(goal, step, page) {
    if (goal.includes('Turing')) {
      if (step === 1)
        return {
          action: 'NAVIGATE',
          target: 'https://www.turing.com/login',
          reason: 'Navigating to Login',
        };
      if (step === 2)
        return {
          action: 'TYPE',
          target: '#email',
          value: 'user@example.com',
          reason: 'Entering credentials',
        };
      // ... more steps
    }
    return { action: 'FINISH', reason: 'Manual override for safety in demo' };
  }

  /**
   * Save the current browser session (cookies, liquid storage) to disk.
   * This allows us to "rehydrate" the agent already logged in next time.
   */
  async saveSession() {
    if (this.context) {
      await this.context.storageState({ path: 'session.json' });
      logger.info('Session saved to session.json');
    }
  }
}

export const agentService = new AgentService();
