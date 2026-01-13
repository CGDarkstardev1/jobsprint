/**
 * Jobsprint Main Application Entry Point
 */

// Import services
import { AgentService } from './services/agent.js';
import { AutoApplyService } from './services/autoApply.js';
import { JobScraperService } from './services/jobScraper.js';
import { ResumeService } from './services/resume.js';
import { StealthBrowser } from './services/stealth.js';
import { AgentDB } from './services/agentDb.js';
import { BrowserManager } from './services/BrowserManager.js';
import { StorageService } from './services/storage.js';

// Import utilities
import { AIClient } from './utils/ai-client.js';
import { ATSChecker } from './utils/ats-checker.js';
import { DocUtils } from './utils/doc-utils.js';
import { Logger } from './utils/logger.js';

// Global jobSprint object with all services
window.jobSprint = {
  // Core services
  AgentService,
  AutoApplyService,
  JobScraperService,
  ResumeService,
  StealthBrowser,
  AgentDB,
  BrowserManager,
  StorageService,

  // Utilities
  AIClient,
  ATSChecker,
  DocUtils,
  Logger,

  // Configuration
  config: {
    anthropicApiKey: null,
    puterApiKey: null,
    maxApplicationsPerDay: 50,
    stealthMode: true,
    autoSave: true,
  },

  // Initialize all services
  async init(options = {}) {
    const logger = new Logger('JobSprint');
    logger.info('Initializing JobSprint platform...');

    try {
      // Set config from options
      if (options.anthropicApiKey) {
        this.config.anthropicApiKey = options.anthropicApiKey;
      }
      if (options.puterApiKey) {
        this.config.puterApiKey = options.puterApiKey;
      }

      // Initialize AgentDB for memory/caching
      this.agentDb = new AgentDB({
        storePath: './data/agentdb',
      });
      await this.agentDb.init();

      // Initialize storage
      this.storage = new StorageService({
        basePath: './data',
      });
      await this.storage.init();

      // Initialize AI client if API key provided
      if (this.config.anthropicApiKey) {
        this.ai = new AIClient({
          apiKey: this.config.anthropicApiKey,
        });
      }

      // Initialize browser manager
      this.browserManager = new BrowserManager({
        headless: options.headless ?? !this.config.stealthMode,
        stealth: this.config.stealthMode,
      });

      logger.info('JobSprint initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize JobSprint:', error);
      throw error;
    }
  },

  // Quick job search
  async searchJobs(criteria) {
    const scraper = new JobScraperService(this);
    return await scraper.search(criteria);
  },

  // Tailor resume for a job
  async tailorResume(jobDescription, userResume) {
    const resumeService = new ResumeService(this);
    return await resumeService.tailor(jobDescription, userResume);
  },

  // Generate cover letter
  async generateCoverLetter(jobDescription, userResume, options = {}) {
    const autoApply = new AutoApplyService(this);
    return await autoApply.generateCoverLetter(jobDescription, userResume, options);
  },

  // Full auto-apply workflow
  async autoApply(criteria) {
    const autoApply = new AutoApplyService(this);
    return await autoApply.autoApplyToJobs(criteria);
  },

  // Check ATS score
  async checkATSScore(resume, jobDescription) {
    const ats = new ATSChecker();
    return await ats.analyze(resume, jobDescription);
  },

  // Generate PDF resume
  async generatePDFResume(resumeData, options = {}) {
    const docUtils = new DocUtils();
    return await docUtils.generatePDF(resumeData, options);
  },
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create app UI
    createAppUI();

    // Initialize jobSprint services
    await window.jobSprint.init();

    console.log('Jobsprint application initialized successfully');
    updateStatus('Ready to search and apply for jobs!');
  } catch (error) {
    console.error('Failed to initialize Jobsprint:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
});

/**
 * Create the full JobSprint UI
 */
function createAppUI() {
  const app = document.getElementById('app');
  app.innerHTML = `
        <header class="header">
            <nav class="nav">
                <div class="logo">
                    <h1>🚀 JobSprint</h1>
                    <span class="tagline">AI-Powered Job Search Automation</span>
                </div>
                <ul class="nav-menu">
                    <li><a href="#search" class="active">Search Jobs</a></li>
                    <li><a href="#apply">Auto-Apply</a></li>
                    <li><a href="#resume">Resume Tools</a></li>
                    <li><a href="#settings">Settings</a></li>
                </ul>
            </nav>
        </header>

        <main class="main">
            <!-- Status Bar -->
            <div id="status-bar" class="status-bar">
                <span id="status-text">Initializing...</span>
            </div>

            <!-- Search Section -->
            <section id="search-section" class="section">
                <h2>🔍 Search Jobs</h2>
                <div class="card">
                    <div class="form-group">
                        <label for="job-keywords">Job Keywords</label>
                        <input type="text" id="job-keywords" placeholder="e.g., Senior Software Engineer" value="software engineer">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="job-location">Location</label>
                            <input type="text" id="job-location" placeholder="e.g., San Francisco, CA" value="remote">
                        </div>
                        <div class="form-group">
                            <label for="job-platform">Platform</label>
                            <select id="job-platform">
                                <option value="all">All Platforms</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="indeed">Indeed</option>
                                <option value="glassdoor">Glassdoor</option>
                                <option value="remoteok">RemoteOK</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="job-type">Job Type</label>
                            <select id="job-type">
                                <option value="full-time">Full-Time</option>
                                <option value="part-time">Part-Time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="experience-level">Experience Level</label>
                            <select id="experience-level">
                                <option value="any">Any Level</option>
                                <option value="entry">Entry Level</option>
                                <option value="mid">Mid Level</option>
                                <option value="senior">Senior Level</option>
                                <option value="executive">Executive</option>
                            </select>
                        </div>
                    </div>
                    <button id="btn-search" class="btn btn-primary">Search Jobs</button>
                    <button id="btn-search-stealth" class="btn btn-secondary">🔒 Stealth Search</button>
                </div>
                
                <!-- Search Results -->
                <div id="search-results" class="results-container"></div>
            </section>

            <!-- Auto-Apply Section -->
            <section id="apply-section" class="section hidden">
                <h2>🤖 Auto-Apply Workflow</h2>
                <div class="card">
                    <h3>Quick Auto-Apply</h3>
                    <p>Configure automatic job application with AI-tailored resumes.</p>
                    
                    <div class="form-group">
                        <label for="auto-apply-keywords">Keywords</label>
                        <input type="text" id="auto-apply-keywords" placeholder="Job keywords" value="software engineer">
                    </div>
                    <div class="form-group">
                        <label for="auto-apply-location">Location</label>
                        <input type="text" id="auto-apply-location" placeholder="Location" value="remote">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="max-applications">Max Applications</label>
                            <input type="number" id="max-applications" value="10" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label for="tailor-resume">
                                <input type="checkbox" id="tailor-resume" checked>
                                AI Tailor Resume
                            </label>
                        </div>
                    </div>
                    <button id="btn-auto-apply" class="btn btn-primary">🚀 Start Auto-Apply</button>
                    <button id="btn-stop-applications" class="btn btn-danger hidden">⏹ Stop Applications</button>
                </div>
                
                <!-- Application Progress -->
                <div id="application-progress" class="progress-container hidden">
                    <h3>📊 Application Progress</h3>
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div id="progress-stats" class="progress-stats"></div>
                    <div id="application-log" class="application-log"></div>
                </div>
            </section>

            <!-- Resume Tools Section -->
            <section id="resume-section" class="section hidden">
                <h2>📝 Resume Tools</h2>
                
                <!-- ATS Checker -->
                <div class="card">
                    <h3>✅ ATS Compatibility Check</h3>
                    <div class="form-group">
                        <label for="ats-resume">Your Resume (Paste text)</label>
                        <textarea id="ats-resume" rows="6" placeholder="Paste your resume here..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="ats-job-desc">Job Description</label>
                        <textarea id="ats-job-desc" rows="6" placeholder="Paste the job description here..."></textarea>
                    </div>
                    <button id="btn-check-ats" class="btn btn-primary">Check ATS Score</button>
                    <div id="ats-results" class="results-box hidden"></div>
                </div>
                
                <!-- Resume Tailoring -->
                <div class="card">
                    <h3>🎯 AI Resume Tailoring</h3>
                    <div class="form-group">
                        <label for="tailor-input">Master Resume (JSON format)</label>
                        <textarea id="tailor-input" rows="6" placeholder='{"name": "John Doe", "skills": [...], "experience": [...]}'></textarea>
                    </div>
                    <div class="form-group">
                        <label for="tailor-job">Target Job Description</label>
                        <textarea id="tailor-job" rows="6" placeholder="Paste the job description..."></textarea>
                    </div>
                    <button id="btn-tailor-resume" class="btn btn-primary">Generate Tailored Resume</button>
                    <button id="btn-download-pdf" class="btn btn-secondary hidden">📄 Download PDF</button>
                    <div id="tailor-results" class="results-box hidden"></div>
                </div>
            </section>

            <!-- Settings Section -->
            <section id="settings-section" class="section hidden">
                <h2>⚙️ Settings</h2>
                <div class="card">
                    <h3>API Configuration</h3>
                    <div class="form-group">
                        <label for="setting-anthropic-key">Anthropic API Key (for AI features)</label>
                        <input type="password" id="setting-anthropic-key" placeholder="sk-ant-api03-...">
                        <small>Required for AI resume tailoring and cover letter generation</small>
                    </div>
                    <button id="btn-save-settings" class="btn btn-primary">Save Settings</button>
                </div>
                
                <div class="card">
                    <h3>Automation Settings</h3>
                    <div class="form-group">
                        <label for="setting-stealth">
                            <input type="checkbox" id="setting-stealth" checked>
                            Enable Stealth Mode (human-like behavior)
                        </label>
                    </div>
                    <div class="form-group">
                        <label for="setting-max-apps">Max Applications Per Day</label>
                        <input type="number" id="setting-max-apps" value="50" min="1" max="100">
                    </div>
                    <div class="form-group">
                        <label for="setting-delay">Application Delay (seconds)</label>
                        <input type="number" id="setting-delay" value="5" min="1" max="30">
                    </div>
                </div>
            </section>
        </main>

        <footer class="footer">
            <p>© 2024 JobSprint AI Automation Platform | Powered by Puter.js</p>
        </footer>
    `;

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-menu a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.getAttribute('href').substring(1);
      showSection(target);
    });
  });

  // Search buttons
  document.getElementById('btn-search').addEventListener('click', handleSearch);
  document.getElementById('btn-search-stealth').addEventListener('click', () => handleSearch(true));

  // Auto-apply buttons
  document.getElementById('btn-auto-apply').addEventListener('click', handleAutoApply);
  document.getElementById('btn-stop-applications').addEventListener('click', stopApplications);

  // Resume tools
  document.getElementById('btn-check-ats').addEventListener('click', handleCheckATS);
  document.getElementById('btn-tailor-resume').addEventListener('click', handleTailorResume);
  document.getElementById('btn-download-pdf').addEventListener('click', handleDownloadPDF);

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', handleSaveSettings);
}

/**
 * Show a specific section
 */
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach((s) => s.classList.add('hidden'));
  document.querySelectorAll('.nav-menu a').forEach((a) => a.classList.remove('active'));

  const section = document.getElementById(`${sectionId}-section`);
  if (section) {
    section.classList.remove('hidden');
  }

  // Update active nav
  const navLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }
}

/**
 * Update status bar
 */
function updateStatus(message, type = 'info') {
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  statusText.textContent = message;
  statusBar.className = `status-bar status-${type}`;
}

/**
 * Handle job search
 */
async function handleSearch(stealth = false) {
  const keywords = document.getElementById('job-keywords').value;
  const location = document.getElementById('job-location').value;
  const platform = document.getElementById('job-platform').value;

  if (!keywords) {
    showError('Please enter job keywords');
    return;
  }

  const searchBtn = document.getElementById('btn-search');
  const stealthBtn = document.getElementById('btn-search-stealth');
  searchBtn.disabled = true;
  stealthBtn.disabled = true;

  updateStatus(stealth ? '🔒 Searching with stealth mode...' : 'Searching for jobs...', 'loading');

  try {
    const results = await window.jobSprint.searchJobs({
      keywords,
      location,
      platform,
      stealth,
      remoteOnly: true,
    });

    displaySearchResults(results);
    updateStatus(`Found ${results.length} jobs!`, 'success');
  } catch (error) {
    console.error('Search failed:', error);
    updateStatus('Search failed. Please try again.', 'error');
    showError(`Search failed: ${error.message}`);
  } finally {
    searchBtn.disabled = false;
    stealthBtn.disabled = false;
  }
}

/**
 * Display search results
 */
function displaySearchResults(jobs) {
  const container = document.getElementById('search-results');

  if (!jobs || jobs.length === 0) {
    container.innerHTML = '<div class="empty-state">No jobs found. Try different keywords.</div>';
    return;
  }

  container.innerHTML = `
        <div class="results-header">
            <h3>📋 ${jobs.length} Jobs Found</h3>
        </div>
        <div class="jobs-list">
            ${jobs
              .map(
                (job) => `
                <div class="job-card" data-url="${job.url}">
                    <div class="job-header">
                        <h4>${job.title}</h4>
                        <span class="job-company">${job.company}</span>
                    </div>
                    <div class="job-details">
                        <span class="job-location">📍 ${job.location}</span>
                        <span class="job-salary">💰 ${job.salary || 'Not specified'}</span>
                        <span class="job-date">📅 ${job.postedDate || 'Recently'}</span>
                    </div>
                    <div class="job-score">
                        <span>Relevance: ${job.relevanceScore || 'N/A'}</span>
                    </div>
                    <div class="job-actions">
                        <a href="${job.url}" target="_blank" class="btn btn-small">View Job</a>
                        <button class="btn btn-small btn-secondary tailor-btn" data-job="${encodeURIComponent(JSON.stringify(job))}">✨ Tailor Resume</button>
                    </div>
                </div>
            `
              )
              .join('')}
        </div>
    `;

  // Setup tailor buttons
  container.querySelectorAll('.tailor-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const job = JSON.parse(decodeURIComponent(e.target.dataset.job));
      handleQuickTailor(job);
    });
  });
}

/**
 * Handle quick resume tailoring from job card
 */
async function handleQuickTailor(job) {
  showSection('resume');
  document.getElementById('tailor-job').value = job.description || '';
  updateStatus(
    'Resume tailoring ready. Paste your resume and click "Generate Tailored Resume"',
    'info'
  );
}

/**
 * Handle auto-apply workflow
 */
async function handleAutoApply() {
  const keywords = document.getElementById('auto-apply-keywords').value;
  const location = document.getElementById('auto-apply-location').value;
  const maxApps = parseInt(document.getElementById('max-applications').value);
  const tailorResume = document.getElementById('tailor-resume').checked;

  if (!keywords) {
    showError('Please enter job keywords');
    return;
  }

  // Show progress section
  document.getElementById('application-progress').classList.remove('hidden');
  document.getElementById('btn-auto-apply').classList.add('hidden');
  document.getElementById('btn-stop-applications').classList.remove('hidden');

  updateStatus('🚀 Starting auto-apply workflow...', 'loading');

  try {
    const results = await window.jobSprint.autoApply({
      keywords,
      location,
      maxApplications: maxApps,
      tailorResume,
      stealth: true,
      onProgress: (progress) => {
        updateProgress(progress);
      },
    });

    updateStatus(`✅ Auto-apply complete! Applied to ${results.applied} jobs.`, 'success');
  } catch (error) {
    console.error('Auto-apply failed:', error);
    updateStatus(`Auto-apply failed: ${error.message}`, 'error');
  } finally {
    document.getElementById('btn-auto-apply').classList.remove('hidden');
    document.getElementById('btn-stop-applications').classList.add('hidden');
  }
}

/**
 * Update application progress
 */
function updateProgress(progress) {
  const { current, total, status, job } = progress;
  const percentage = (current / total) * 100;

  document.getElementById('progress-fill').style.width = `${percentage}%`;
  document.getElementById('progress-stats').innerHTML = `
        <span>${current} / ${total} applications (${Math.round(percentage)}%)</span>
        <span class="status-${status}">${status}</span>
    `;

  const log = document.getElementById('application-log');
  log.innerHTML =
    `<div class="log-entry log-${status}">[${current}/${total}] ${status}: ${job?.title || 'Processing...'}</div>` +
    log.innerHTML;
}

/**
 * Stop applications
 */
function stopApplications() {
  window.jobSprint.stopApplications = true;
  updateStatus('⏹ Stopping applications...', 'warning');
}

/**
 * Handle ATS check
 */
async function handleCheckATS() {
  const resume = document.getElementById('ats-resume').value;
  const jobDesc = document.getElementById('ats-job-desc').value;

  if (!resume || !jobDesc) {
    showError('Please paste both your resume and the job description');
    return;
  }

  updateStatus('Checking ATS compatibility...', 'loading');

  try {
    const result = await window.jobSprint.checkATSScore(resume, jobDesc);

    const resultsBox = document.getElementById('ats-results');
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = `
            <h4>📊 ATS Analysis Results</h4>
            <div class="score-display">
                <div class="score-circle" style="--score: ${result.score}">
                    <span>${result.score}</span>
                </div>
                <div class="score-label">ATS Compatibility Score</div>
            </div>
            <div class="ats-details">
                <h5>✅ Matched Keywords (${result.matchedKeywords.length})</h5>
                <div class="keyword-tags">
                    ${result.matchedKeywords.map((k) => `<span class="tag tag-success">${k}</span>`).join('')}
                </div>
                <h5>❌ Missing Keywords (${result.missingKeywords.length})</h5>
                <div class="keyword-tags">
                    ${result.missingKeywords.map((k) => `<span class="tag tag-warning">${k}</span>`).join('')}
                </div>
                <h5>💡 Suggestions</h5>
                <ul>
                    ${result.suggestions.map((s) => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;

    updateStatus(`ATS Score: ${result.score}/100`, 'success');
  } catch (error) {
    updateStatus('ATS check failed', 'error');
    showError(error.message);
  }
}

/**
 * Handle resume tailoring
 */
async function handleTailorResume() {
  const resumeJson = document.getElementById('tailor-input').value;
  const jobDesc = document.getElementById('tailor-job').value;

  if (!resumeJson || !jobDesc) {
    showError('Please provide both resume and job description');
    return;
  }

  let userResume;
  try {
    userResume = JSON.parse(resumeJson);
  } catch (e) {
    showError('Invalid JSON format for resume');
    return;
  }

  updateStatus('AI is tailoring your resume...', 'loading');

  try {
    const tailoredResume = await window.jobSprint.tailorResume(jobDesc, userResume);

    const resultsBox = document.getElementById('tailor-results');
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = `
            <h4>✨ Tailored Resume</h4>
            <div class="tailored-content">
                <pre>${JSON.stringify(tailoredResume, null, 2)}</pre>
            </div>
        `;

    // Show download button
    document.getElementById('btn-download-pdf').classList.remove('hidden');
    document.getElementById('btn-download-pdf').dataset.resume = JSON.stringify(tailoredResume);

    updateStatus('Resume tailored successfully!', 'success');
  } catch (error) {
    updateStatus('Resume tailoring failed', 'error');
    showError(error.message);
  }
}

/**
 * Handle PDF download
 */
async function handleDownloadPDF() {
  const resumeData = JSON.parse(document.getElementById('btn-download-pdf').dataset.resume);

  try {
    const pdfBuffer = await window.jobSprint.generatePDFResume(resumeData);

    // Create download link
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored_resume.pdf';
    a.click();
    URL.revokeObjectURL(url);

    updateStatus('PDF downloaded!', 'success');
  } catch (error) {
    showError(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Handle settings save
 */
function handleSaveSettings() {
  const anthropicKey = document.getElementById('setting-anthropic-key').value;
  const stealth = document.getElementById('setting-stealth').checked;
  const maxApps = parseInt(document.getElementById('setting-max-apps').value);

  window.jobSprint.config.anthropicApiKey = anthropicKey;
  window.jobSprint.config.stealthMode = stealth;
  window.jobSprint.config.maxApplicationsPerDay = maxApps;

  // Initialize AI client if key provided
  if (anthropicKey) {
    window.jobSprint.ai = new AIClient({ apiKey: anthropicKey });
  }

  updateStatus('Settings saved!', 'success');
  alert('Settings saved successfully!');
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}
