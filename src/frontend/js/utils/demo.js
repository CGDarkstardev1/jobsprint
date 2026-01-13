import { agentService } from '../services/agent.js';
import { logger } from '../utils/logger.js';

/**
 * Demo Script: Login to a dummy portal
 */
async function demoTask() {
    const task = {
        intent: "Login to Demo Portal and Scrape dashboard",
        config: {
            url: "https://the-internet.herokuapp.com/login",
            actions: [
                { type: 'TYPE', target: '#username', value: 'tomsmith' },
                { type: 'TYPE', target: '#password', value: 'SuperSecretPassword!' },
                { type: 'CLICK', target: 'button[type="submit"]' }
            ]
        }
    };

    logger.info("Running Demo Agentic Loop...");
    const result = await agentService.executeTask(task);
    logger.info("Demo Result:", result);
}

// Uncomment to run directly for testing
// demoTask();
