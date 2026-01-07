/**
 * Jobsprint Main Application Entry Point
 */

import { PuterService } from './ai/puter-service.js';
import { App } from './core/app.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Puter.js service
        const puterService = new PuterService();
        await puterService.init();

        // Create and start application
        const app = new App(puterService);
        await app.start();

        console.log('Jobsprint application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Jobsprint:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
});

/**
 * Show error message to user
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
}
