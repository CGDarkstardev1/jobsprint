/**
 * UniversalBrowserService - Perfect Browser Automation for Any Webpage/App
 *
 * Implements a multi-strategy approach to element detection and manipulation:
 * 1. CSS Selectors (fastest, most reliable when available)
 * 2. Accessibility Tree (ARIA roles, labels - works across frameworks)
 * 3. Text Content Matching (finds elements by visible text)
 * 4. Vision-based Coordinates (AI analyzes screenshot, returns click points)
 *
 * Features:
 * - Self-healing selectors with visual verification
 * - Automatic iframe/shadow DOM traversal
 * - Universal form detection and auto-fill
 * - Human-like interaction patterns (stealth)
 * - Confidence scoring for element matches
 * - Session persistence across automation runs
 */

import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import { browserManager } from './BrowserManager.js';
import { stealthService } from './stealth.js';
import { imageResizeUtil } from '../utils/image-resize.js';
import puter from '../utils/ai-client.js';

const STRATEGY = {
  CSS_SELECTOR: 'css',
  ACCESSIBILITY: 'accessibility',
  TEXT_CONTENT: 'text',
  VISION_COORDINATES: 'vision',
  MCP_SNAPSHOT: 'mcp_snapshot',
  COMBINED: 'combined',
};

/**
 * Element types for universal detection
 */
const ELEMENT_TYPE = {
  BUTTON: 'button',
  LINK: 'link',
  INPUT: 'input',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE_UPLOAD: 'file',
  SUBMIT: 'submit',
  ANY: 'any',
};

class UniversalBrowserService {
  constructor() {
    this.browserManager = browserManager;
    this.stealth = stealthService;
    this.imageResize = imageResizeUtil;
    this.puter = puter;

    // Cache for selector healing
    this.selectorCache = new Map();

    // Vision model configuration
    this.visionModel = 'claude-sonnet-4-5';
    this.visionMaxTokens = 2048;

    // Confidence thresholds
    this.MIN_CONFIDENCE = 0.7;
    this.HIGH_CONFIDENCE = 0.9;
  }

  /**
   * Initialize browser and return page context
   */
  async init(options = {}) {
    const { headless = false, useSession = true } = options;
    const { browser, context, page } = await this.browserManager.getContext();

    this.browser = browser;
    this.context = context;
    this.page = page;

    logger.info('UniversalBrowserService initialized');
    return { browser, context, page };
  }

  /**
   * Navigate to URL with intelligent wait
   */
  async navigate(url, options = {}) {
    const { waitUntil = 'domcontentloaded', timeout = 30000 } = options;

    await this.ensurePage();

    logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil, timeout });

    // Wait for page to stabilize
    await this.waitForStable();

    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
  }

  /**
   * UNIVERSAL ELEMENT FINDER
   * Finds elements using multiple strategies with fallback
   *
   * @param {Object} query - Element query
   * @param {string} query.description - Human-readable description (e.g., "Sign In button")
   * @param {string} query.type - Element type (button, input, link, etc.)
   * @param {string} query.text - Text content to match
   * @param {string} query.selector - CSS selector (optional, used first if provided)
   * @param {string} query.role - ARIA role
   * @param {string} query.label - ARIA label or visible label
   * @param {Object} query.near - Find element near another element
   * @returns {Promise<{element: ElementHandle, confidence: number, strategy: string}>}
   */
  async findElement(query) {
    await this.ensurePage();

    const { description, type, text, selector, role, label, near } = query;

    logger.info(`Finding element: ${description || text || selector || role}`);

    const strategies = [];

    // Strategy 1: Direct CSS selector (if provided)
    if (selector) {
      strategies.push({
        name: STRATEGY.CSS_SELECTOR,
        fn: () => this.findBySelector(selector),
      });
    }

    // Strategy 2: Accessibility tree (ARIA roles and labels)
    if (role || label || type) {
      strategies.push({
        name: STRATEGY.ACCESSIBILITY,
        fn: () => this.findByAccessibility({ role, label, type, text }),
      });
    }

    // Strategy 3: Text content matching
    if (text) {
      strategies.push({
        name: STRATEGY.TEXT_CONTENT,
        fn: () => this.findByText(text, type),
      });
    }

    // Strategy 4: Vision-based (AI analyzes screenshot)
    strategies.push({
      name: STRATEGY.VISION_COORDINATES,
      fn: () => this.findByVision(query),
    });

    // Try each strategy in order
    for (const strategy of strategies) {
      try {
        const result = await strategy.fn();
        if (result && result.element) {
          // Verify element is visible and interactable
          const isValid = await this.verifyElement(result.element);
          if (isValid) {
            logger.info(
              `Found element using ${strategy.name} strategy (confidence: ${result.confidence})`
            );
            return {
              ...result,
              strategy: strategy.name,
            };
          }
        }
      } catch (error) {
        logger.debug(`Strategy ${strategy.name} failed: ${error.message}`);
      }
    }

    // All strategies failed
    throw new Error(`Could not find element: ${description || text || selector}`);
  }

  async findBySelector(selector) {
    const element = await this.page.$(selector);
    if (!element) return null;

    return {
      element,
      confidence: 1.0,
      selector,
    };
  }

  async findWithHealing(originalQuery) {
    const cacheKey = JSON.stringify(originalQuery);

    if (this.selectorCache.has(cacheKey)) {
      const cached = this.selectorCache.get(cacheKey);
      try {
        const result = await this.findBySelector(cached.healedSelector);
        if (result) {
          logger.debug(`Self-healing cache hit for: ${originalQuery.description}`);
          return { ...result, healed: true, originalQuery };
        }
      } catch {
        this.selectorCache.delete(cacheKey);
      }
    }

    const result = await this.findElement(originalQuery);

    if (result && result.element) {
      const healedSelector = await this.generateRobustSelector(result.element);
      if (healedSelector) {
        this.selectorCache.set(cacheKey, {
          healedSelector,
          originalQuery,
          timestamp: Date.now(),
        });
      }
    }

    return result;
  }

  async generateRobustSelector(element) {
    try {
      return await this.page.evaluate((el) => {
        if (el.id) return `#${el.id}`;

        const dataTestId = el.getAttribute('data-testid') || el.getAttribute('data-test');
        if (dataTestId) return `[data-testid="${dataTestId}"]`;

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) return `[aria-label="${ariaLabel}"]`;

        const role = el.getAttribute('role');
        const text = el.textContent?.trim().slice(0, 30);
        if (role && text) return `[role="${role}"]:has-text("${text}")`;

        return null;
      }, element);
    } catch {
      return null;
    }
  }

  async verifyAndHeal(query, previousResult) {
    const isStillValid =
      previousResult.element && (await this.verifyElement(previousResult.element));

    if (isStillValid) return previousResult;

    logger.info(`Element no longer valid, attempting self-heal for: ${query.description}`);

    const cacheKey = JSON.stringify(query);
    this.selectorCache.delete(cacheKey);

    return await this.findWithHealing(query);
  }

  /**
   * Find element by accessibility tree (ARIA roles, labels)
   */
  async findByAccessibility({ role, label, type, text }) {
    let locator;

    // Map element types to ARIA roles
    const roleMap = {
      [ELEMENT_TYPE.BUTTON]: 'button',
      [ELEMENT_TYPE.LINK]: 'link',
      [ELEMENT_TYPE.INPUT]: 'textbox',
      [ELEMENT_TYPE.TEXTAREA]: 'textbox',
      [ELEMENT_TYPE.SELECT]: 'combobox',
      [ELEMENT_TYPE.CHECKBOX]: 'checkbox',
      [ELEMENT_TYPE.RADIO]: 'radio',
    };

    const ariaRole = role || roleMap[type];

    if (ariaRole && (label || text)) {
      // Use getByRole with name
      locator = this.page.getByRole(ariaRole, { name: label || text });
    } else if (ariaRole) {
      locator = this.page.getByRole(ariaRole);
    } else if (label) {
      locator = this.page.getByLabel(label);
    } else if (text) {
      locator = this.page.getByText(text, { exact: false });
    }

    if (!locator) return null;

    const count = await locator.count();
    if (count === 0) return null;

    // Return first visible match
    const element = await locator.first().elementHandle();

    return {
      element,
      confidence: count === 1 ? 0.95 : 0.8,
      locator: locator.toString(),
    };
  }

  /**
   * Find element by visible text content
   */
  async findByText(text, type) {
    // Build selector based on type
    const typeSelectors = {
      [ELEMENT_TYPE.BUTTON]: 'button, [role="button"], input[type="submit"], input[type="button"]',
      [ELEMENT_TYPE.LINK]: 'a, [role="link"]',
      [ELEMENT_TYPE.INPUT]: 'input:not([type="hidden"]), textarea',
      [ELEMENT_TYPE.ANY]: '*',
    };

    const baseSelector = typeSelectors[type] || '*';

    // Use Playwright's text matching
    const locator = this.page.locator(`${baseSelector}:has-text("${text}")`);
    const count = await locator.count();

    if (count === 0) {
      // Try case-insensitive regex
      const regexLocator = this.page
        .locator(baseSelector)
        .filter({ hasText: new RegExp(text, 'i') });
      const regexCount = await regexLocator.count();

      if (regexCount === 0) return null;

      return {
        element: await regexLocator.first().elementHandle(),
        confidence: 0.75,
        matchedText: text,
      };
    }

    return {
      element: await locator.first().elementHandle(),
      confidence: count === 1 ? 0.9 : 0.75,
      matchedText: text,
    };
  }

  /**
   * Find element using Vision AI (screenshot analysis)
   * This is the fallback for complex UIs, iframes, canvas, etc.
   */
  async findByVision(query) {
    const { description, type, text, action } = query;

    // Capture and resize screenshot
    const screenshot = await this.page.screenshot({ encoding: 'base64' });
    const { image: resizedImage, metadata } = await this.imageResize.resizeWithMetadata(screenshot);

    const viewport = this.page.viewportSize();
    const scaleX = viewport.width / metadata.width;
    const scaleY = viewport.height / metadata.height;

    const imageDataUrl =
      typeof resizedImage === 'string' ? resizedImage : `data:image/png;base64,${resizedImage}`;

    // Vision prompt for element detection
    const prompt = `You are a precise UI element detector. Analyze this screenshot and find the element described below.

ELEMENT TO FIND:
Description: ${description || 'N/A'}
Type: ${type || 'any'}
Text/Label: ${text || 'N/A'}
Action needed: ${action || 'click'}

IMAGE SIZE: ${metadata.width}x${metadata.height}

INSTRUCTIONS:
1. Carefully scan the entire screenshot for the described element
2. Consider all possible matches and choose the BEST one
3. Return the EXACT pixel coordinates of the element's CENTER
4. If the element is inside an iframe or overlay, still identify it

RETURN ONLY VALID JSON:
{
  "found": true/false,
  "confidence": 0.0-1.0,
  "x": center_x_coordinate,
  "y": center_y_coordinate,
  "width": approximate_element_width,
  "height": approximate_element_height,
  "elementType": "button|input|link|etc",
  "visibleText": "text shown on element",
  "reason": "why this is the correct element"
}

If element not found, set found=false and explain in reason.`;

    try {
      const response = await this.puter.ai.chat(
        prompt,
        imageDataUrl,
        {
          model: this.visionModel,
          max_tokens: this.visionMaxTokens,
        },
        false
      );

      const content = response.message?.content;
      const jsonMatch = content?.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON in vision response');
      }

      const result = JSON.parse(jsonMatch[0]);

      if (!result.found || result.confidence < this.MIN_CONFIDENCE) {
        return null;
      }

      // Translate coordinates from image to viewport
      const viewportX = Math.round(result.x * scaleX);
      const viewportY = Math.round(result.y * scaleY);

      logger.info(
        `Vision found element at (${viewportX}, ${viewportY}) with confidence ${result.confidence}`
      );

      return {
        element: null, // No ElementHandle for vision-based detection
        coordinates: { x: viewportX, y: viewportY },
        confidence: result.confidence,
        visionResult: result,
        scaleFactors: { x: scaleX, y: scaleY },
      };
    } catch (error) {
      logger.error(`Vision detection failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify element is visible and interactable
   */
  async verifyElement(element) {
    if (!element) return false;

    try {
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      const box = await element.boundingBox();

      return isVisible && isEnabled && box !== null;
    } catch {
      return false;
    }
  }

  /**
   * UNIVERSAL CLICK
   * Clicks an element using the best available strategy
   */
  async click(query, options = {}) {
    const { humanLike = true, doubleClick = false, rightClick = false } = options;

    const result = await this.findElement(query);

    if (result.coordinates) {
      // Vision-based click (no ElementHandle)
      const { x, y } = result.coordinates;

      if (humanLike) {
        await this.stealth.mouseCurve(this.page, { x, y });
      } else {
        await this.page.mouse.move(x, y);
      }

      if (doubleClick) {
        await this.page.mouse.dblclick(x, y);
      } else if (rightClick) {
        await this.page.mouse.click(x, y, { button: 'right' });
      } else {
        await this.page.mouse.click(x, y);
      }

      logger.info(`Clicked at coordinates (${x}, ${y})`);
    } else if (result.element) {
      // Element-based click
      if (humanLike) {
        const box = await result.element.boundingBox();
        if (box) {
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await this.stealth.mouseCurve(this.page, { x, y });
        }
      }

      if (doubleClick) {
        await result.element.dblclick();
      } else if (rightClick) {
        await result.element.click({ button: 'right' });
      } else {
        await result.element.click();
      }

      logger.info(`Clicked element using ${result.strategy} strategy`);
    }

    // Wait for potential navigation or DOM changes
    await this.waitForStable();

    return result;
  }

  /**
   * UNIVERSAL TYPE
   * Types text into an element with human-like delays
   */
  async type(query, text, options = {}) {
    const { humanLike = true, clear = true, submit = false } = options;

    const result = await this.findElement(query);

    if (result.coordinates) {
      // Vision-based typing
      const { x, y } = result.coordinates;

      await this.page.mouse.click(x, y);
      await this.page.waitForTimeout(100);

      if (clear) {
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
      }

      if (humanLike) {
        await this.typeHumanLike(text);
      } else {
        await this.page.keyboard.type(text);
      }
    } else if (result.element) {
      if (humanLike) {
        await this.stealth.humanTyping(this.page, result.element, text, { clear });
      } else {
        if (clear) {
          await result.element.fill('');
        }
        await result.element.type(text);
      }
    }

    if (submit) {
      await this.page.keyboard.press('Enter');
    }

    logger.info(`Typed "${text.substring(0, 20)}..." into element`);

    return result;
  }

  /**
   * Type text with human-like delays
   */
  async typeHumanLike(text) {
    for (const char of text) {
      await this.page.keyboard.type(char);
      // Random delay between 50-150ms
      await this.page.waitForTimeout(50 + Math.random() * 100);
    }
  }

  /**
   * UNIVERSAL FORM FILL
   * Automatically detects and fills form fields
   */
  async fillForm(formData, options = {}) {
    const { submitAfter = false, verifyFields = true } = options;

    await this.ensurePage();

    const filledFields = [];
    const errors = [];

    for (const [fieldName, value] of Object.entries(formData)) {
      try {
        // Find field by label, name, placeholder, or id
        const query = {
          description: `form field for ${fieldName}`,
          type: ELEMENT_TYPE.INPUT,
          label: fieldName,
        };

        // Try multiple strategies to find the field
        let found = false;

        // Strategy 1: By label
        const byLabel = this.page.getByLabel(fieldName, { exact: false });
        if ((await byLabel.count()) > 0) {
          await byLabel.first().fill(value);
          found = true;
        }

        // Strategy 2: By placeholder
        if (!found) {
          const byPlaceholder = this.page.getByPlaceholder(fieldName, { exact: false });
          if ((await byPlaceholder.count()) > 0) {
            await byPlaceholder.first().fill(value);
            found = true;
          }
        }

        // Strategy 3: By name or id attribute
        if (!found) {
          const byAttr = this.page.$(`[name*="${fieldName}" i], [id*="${fieldName}" i]`);
          if (byAttr) {
            await byAttr.fill(value);
            found = true;
          }
        }

        // Strategy 4: Vision-based
        if (!found) {
          await this.type(query, value);
          found = true;
        }

        filledFields.push({ field: fieldName, value, success: true });
        logger.info(`Filled field: ${fieldName}`);
      } catch (error) {
        errors.push({ field: fieldName, error: error.message });
        logger.warn(`Failed to fill field ${fieldName}: ${error.message}`);
      }
    }

    // Submit if requested
    if (submitAfter) {
      try {
        await this.click({
          description: 'submit button',
          type: ELEMENT_TYPE.SUBMIT,
          text: 'submit',
        });
      } catch {
        // Try Enter key as fallback
        await this.page.keyboard.press('Enter');
      }
    }

    return {
      success: errors.length === 0,
      filledFields,
      errors,
    };
  }

  /**
   * Get page accessibility snapshot (better than screenshot for element detection)
   */
  async getAccessibilitySnapshot() {
    await this.ensurePage();

    const snapshot = await this.page.accessibility.snapshot();
    return snapshot;
  }

  async getStructuredSnapshot() {
    await this.ensurePage();

    const snapshot = await this.page.accessibility.snapshot({ interestingOnly: true });

    const formatNode = (node, refs = { counter: 0 }) => {
      if (!node) return null;

      refs.counter++;
      const ref = `e${refs.counter}`;

      const parts = [];
      if (node.role) parts.push(node.role);
      if (node.name) parts.push(`"${node.name}"`);

      const attributes = [];
      if (node.required) attributes.push('required');
      if (node.checked) attributes.push('checked');
      if (node.selected) attributes.push('selected');
      if (node.disabled) attributes.push('disabled');
      if (node.focused) attributes.push('focused');

      const attrStr = attributes.length > 0 ? ` [${attributes.join('] [')}]` : '';

      return {
        ref,
        description: `${parts.join(' ')}${attrStr}`,
        role: node.role,
        name: node.name,
        children: node.children?.map((child) => formatNode(child, refs)).filter(Boolean) || [],
      };
    };

    return formatNode(snapshot);
  }

  async findByAccessibilityRef(ref) {
    const snapshot = await this.getStructuredSnapshot();

    const findRef = (node) => {
      if (node.ref === ref) return node;
      for (const child of node.children || []) {
        const found = findRef(child);
        if (found) return found;
      }
      return null;
    };

    const target = findRef(snapshot);
    if (!target) return null;

    const locator = this.page.getByRole(target.role, { name: target.name });
    if ((await locator.count()) > 0) {
      return {
        element: await locator.first().elementHandle(),
        confidence: 0.95,
        ref,
        target,
      };
    }

    return null;
  }

  /**
   * Take screenshot with optional element highlighting
   */
  async screenshot(options = {}) {
    const { fullPage = false, highlight = null, filename = null } = options;

    await this.ensurePage();

    if (highlight) {
      // Highlight element before screenshot
      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.style.outline = '3px solid red';
          el.style.outlineOffset = '2px';
        }
      }, highlight);
    }

    const screenshotOptions = { fullPage };
    if (filename) {
      screenshotOptions.path = filename;
    }

    const screenshot = await this.page.screenshot(screenshotOptions);

    if (highlight) {
      // Remove highlight
      await this.page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }
      }, highlight);
    }

    return screenshot;
  }

  /**
   * Wait for page to stabilize (no pending network requests or DOM changes)
   */
  async waitForStable(options = {}) {
    const { timeout = 5000, networkIdle = true } = options;

    try {
      if (networkIdle) {
        await this.page.waitForLoadState('networkidle', { timeout });
      } else {
        await this.page.waitForLoadState('domcontentloaded', { timeout });
      }
    } catch {
      // Timeout is acceptable, page may never fully stabilize
    }

    // Small additional wait for any animations
    await this.page.waitForTimeout(200);
  }

  /**
   * Handle iframes - switch context or find elements within
   */
  async switchToFrame(frameIdentifier) {
    await this.ensurePage();

    let frame;

    if (typeof frameIdentifier === 'string') {
      // Find frame by name, id, or selector
      frame = this.page.frameLocator(frameIdentifier);
    } else if (typeof frameIdentifier === 'number') {
      // Find frame by index
      const frames = this.page.frames();
      frame = frames[frameIdentifier];
    }

    if (!frame) {
      throw new Error(`Frame not found: ${frameIdentifier}`);
    }

    return frame;
  }

  /**
   * Execute in all frames (for finding elements across iframes)
   */
  async executeInAllFrames(fn) {
    await this.ensurePage();

    const results = [];
    const frames = this.page.frames();

    for (const frame of frames) {
      try {
        const result = await fn(frame);
        if (result) {
          results.push({ frame: frame.name() || frame.url(), result });
        }
      } catch (error) {
        logger.debug(`Frame execution failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Handle shadow DOM elements
   */
  async findInShadowDOM(hostSelector, innerSelector) {
    await this.ensurePage();

    const element = await this.page.evaluateHandle(
      ({ host, inner }) => {
        const hostEl = document.querySelector(host);
        if (!hostEl || !hostEl.shadowRoot) return null;
        return hostEl.shadowRoot.querySelector(inner);
      },
      { host: hostSelector, inner: innerSelector }
    );

    return element;
  }

  /**
   * Ensure page is available
   */
  async ensurePage() {
    if (!this.page || this.page.isClosed()) {
      const { page } = await this.browserManager.getContext();
      this.page = page;
    }
  }

  /**
   * Run an autonomous goal-based automation
   */
  async runGoal(goal, options = {}) {
    const { maxSteps = 30, verifyEachStep = true } = options;

    logger.info(`Starting goal-based automation: ${goal}`);

    const history = [];
    let step = 0;
    let success = false;

    while (step < maxSteps && !success) {
      step++;

      // Capture current state
      const screenshot = await this.page.screenshot({ encoding: 'base64' });
      const { image, metadata } = await this.imageResize.resizeWithMetadata(screenshot);
      const viewport = this.page.viewportSize();

      const scaleX = viewport.width / metadata.width;
      const scaleY = viewport.height / metadata.height;

      const imageDataUrl = typeof image === 'string' ? image : `data:image/png;base64,${image}`;

      // Ask AI for next action
      const prompt = `You are a browser automation AI. Complete this goal: ${goal}

Current URL: ${this.page.url()}
Step: ${step}/${maxSteps}
Viewport: ${viewport.width}x${viewport.height}
Image: ${metadata.width}x${metadata.height}

Previous actions:
${history
  .slice(-5)
  .map((h) => `- ${h.action}: ${h.reason}`)
  .join('\n')}

Analyze the screenshot and return the NEXT action as JSON:
{
  "action": "CLICK" | "TYPE" | "NAVIGATE" | "SCROLL" | "WAIT" | "FINISH",
  "target": {
    "description": "human-readable element description",
    "type": "button|input|link|etc",
    "text": "visible text on element",
    "selector": "CSS selector if obvious",
    "coordinates": {"x": number, "y": number} // relative to image size
  },
  "value": "text to type (for TYPE action)",
  "reason": "why this action advances the goal",
  "goalComplete": boolean
}`;

      try {
        const response = await this.puter.ai.chat(
          prompt,
          imageDataUrl,
          { model: this.visionModel, max_tokens: 1024 },
          false
        );

        const content = response.message?.content;
        const jsonMatch = content?.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('No JSON in response');
        }

        const decision = JSON.parse(jsonMatch[0]);
        history.push(decision);

        logger.info(`Step ${step}: ${decision.action} - ${decision.reason}`);

        if (decision.action === 'FINISH') {
          success = decision.goalComplete !== false;
          break;
        }

        // Execute the action
        switch (decision.action) {
          case 'CLICK':
            if (decision.target.coordinates) {
              const x = Math.round(decision.target.coordinates.x * scaleX);
              const y = Math.round(decision.target.coordinates.y * scaleY);
              await this.stealth.mouseCurve(this.page, { x, y });
              await this.page.mouse.click(x, y);
            } else {
              await this.click(decision.target);
            }
            break;

          case 'TYPE':
            await this.type(decision.target, decision.value);
            break;

          case 'NAVIGATE':
            await this.navigate(decision.target.selector || decision.value);
            break;

          case 'SCROLL':
            await this.page.mouse.wheel(0, parseInt(decision.value) || 300);
            break;

          case 'WAIT':
            await this.page.waitForTimeout(parseInt(decision.value) || 2000);
            break;
        }

        // Wait for stability after action
        await this.waitForStable();
      } catch (error) {
        logger.error(`Step ${step} failed: ${error.message}`);
        history.push({
          action: 'ERROR',
          reason: error.message,
          step,
        });
      }
    }

    return {
      success,
      stepsCompleted: step,
      history,
    };
  }

  /**
   * Save current session state
   */
  async saveSession() {
    await this.browserManager.saveSession();
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    await this.browserManager.cleanup();
  }
}

export const universalBrowser = new UniversalBrowserService();
export { UniversalBrowserService, STRATEGY, ELEMENT_TYPE };
