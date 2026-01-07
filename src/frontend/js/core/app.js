/**
 * Core Application Class
 * Manages application lifecycle and state
 */

export class App {
    constructor(puterService) {
        this.puterService = puterService;
        this.routes = new Map();
        this.currentRoute = null;
    }

    /**
     * Initialize and start the application
     */
    async start() {
        console.log('Starting Jobsprint application...');

        // Setup routes
        this.setupRoutes();

        // Initialize UI components
        this.initializeUI();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Application started successfully');
    }

    /**
     * Setup application routes
     */
    setupRoutes() {
        this.routes.set('home', () => this.renderHome());
        this.routes.set('workflows', () => this.renderWorkflows());
        this.routes.set('integrations', () => this.renderIntegrations());
        this.routes.set('docs', () => this.renderDocs());
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize navigation
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('href').substring(1);
                this.navigate(route);
            });
        });

        // Get Started button
        const getStartedBtn = document.getElementById('get-started');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                this.navigate('workflows');
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const route = event.state?.route || 'home';
            this.navigate(route, false);
        });

        // Handle initial route
        const initialRoute = window.location.hash.substring(1) || 'home';
        this.navigate(initialRoute, false);
    }

    /**
     * Navigate to a route
     */
    navigate(route, pushState = true) {
        if (this.routes.has(route)) {
            this.currentRoute = route;
            const renderFn = this.routes.get(route);
            renderFn();

            if (pushState) {
                window.history.pushState({ route }, '', `#${route}`);
            }
        } else {
            console.warn(`Route not found: ${route}`);
            this.navigate('home', false);
        }
    }

    /**
     * Render home page
     */
    renderHome() {
        console.log('Rendering home page');
        // Home page content is already in HTML
    }

    /**
     * Render workflows page
     */
    renderWorkflows() {
        console.log('Rendering workflows page');
        const main = document.querySelector('.main');
        main.textContent = '';
        
        const section = document.createElement('section');
        section.className = 'workflows';
        section.innerHTML = `
            <h2>Your Workflows</h2>
            <p>Create and manage your automation workflows</p>
            <div class="workflow-list">
                <p class="text-center">No workflows yet. Create your first one!</p>
            </div>
        `;
        main.appendChild(section);
    }

    /**
     * Render integrations page
     */
    renderIntegrations() {
        console.log('Rendering integrations page');
        const main = document.querySelector('.main');
        main.textContent = '';
        
        const section = document.createElement('section');
        section.className = 'integrations';
        section.innerHTML = `
            <h2>Integrations</h2>
            <p>Connect your favorite apps and services</p>
            <div class="integration-list">
                <div class="integration-card">
                    <h3>Zapier</h3>
                    <p>30,000+ app integrations</p>
                    <button class="btn btn-primary">Connect</button>
                </div>
            </div>
        `;
        main.appendChild(section);
    }

    /**
     * Render documentation page
     */
    renderDocs() {
        console.log('Rendering documentation page');
        const main = document.querySelector('.main');
        main.textContent = '';
        
        const section = document.createElement('section');
        section.className = 'docs';
        section.innerHTML = `
            <h2>Documentation</h2>
            <p>Learn how to use Jobsprint</p>
            <div class="doc-list">
                <article class="doc-card">
                    <h3>Getting Started</h3>
                    <p>Quick start guide to building your first workflow</p>
                    <a href="#" class="btn btn-secondary">Read More</a>
                </article>
            </div>
        `;
        main.appendChild(section);
    }
}
