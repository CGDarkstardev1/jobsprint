import { ultraWorkService } from '../services/ultra-work.js';
import { storageService } from '../services/storage.js';
import { autoApplyService } from '../services/autoApply.js';
import { jobScraperService } from '../services/jobScraper.js';
import { resumeService } from '../services/resume.js';
import { universalBrowser } from '../services/UniversalBrowserService.js';
import { browserManager } from '../services/BrowserManager.js';
import { agentService } from '../services/agent.js';

// Initialize services on startup
export const initializeUltraWork = async () => {
  try {
    console.log('🚀 Initializing Ultra Work Mode...');

    // Initialize Ultra Work Service
    await ultraWorkService.initialize();

    // Initialize Storage Service
    await storageService.initialize();

    // Initialize Resume Service
    await resumeService.init();

    console.log('✅ Ultra Work Mode initialized successfully');
    console.log('📊 Status:', ultraWorkService.getStatus());
  } catch (error) {
    console.error('❌ Failed to initialize Ultra Work Mode:', error);
    throw error;
  }
};

// Export services for use in routes
export {
  ultraWorkService,
  storageService,
  autoApplyService,
  jobScraperService,
  resumeService,
  universalBrowser,
  browserManager,
  agentService,
};
