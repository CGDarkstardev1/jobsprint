import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import { URL } from 'url';

const router = express.Router();

function normalizeUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch (e) {
    return href;
  }
}

function parseIndeedSearch(html, baseUrl = 'https://www.indeed.com') {
  const $ = cheerio.load(html);
  const jobs = [];

  // New Indeed markup tends to use data-jk attributes on links or anchors
  // Try a few selectors for robustness
  const anchors = $('a[data-jk],a[href*="/rc/clk?jk=", a[href*="/clk?jk="]');

  if (anchors.length === 0) {
    // Fallback: look for job tiles
    $('div.job_seen_beacon, div.slider_item').each((i, el) => {
      const title = $(el).find('h2, h3, a').first().text().trim();
      const link = $(el).find('a').first().attr('href') || '';
      const company = $(el).find('.companyName').text().trim() || $(el).find('.company').text().trim();
      const location = $(el).find('.companyLocation').text().trim();
      const snippet = $(el).find('.job-snippet').text().trim() || $(el).find('.job-snippet').text().trim();
      const jk = $(el).attr('data-jk') || '';
      if (title && link) {
        jobs.push({
          id: jk || link.split('jk=')[1] || `${i}_${Date.now()}`,
          title,
          company,
          location,
          snippet,
          platform: 'indeed',
          platformUrl: normalizeUrl(baseUrl, link)
        });
      }
    });
  } else {
    anchors.each((i, a) => {
      const $a = $(a);
      const jk = $a.attr('data-jk') || '';
      const title = $a.text().trim() || $a.attr('title') || '';
      const link = $a.attr('href') || '';

      // Ascend to find company and location
      const parent = $a.closest('.slider_item, .job_seen_beacon, .result, .jobsearch-SerpJobCard');
      const company = parent.find('.companyName').text().trim() || parent.find('.company').text().trim() || '';
      const location = parent.find('.companyLocation').text().trim() || '';
      const snippet = parent.find('.job-snippet').text().trim() || '';

      if (title && link) {
        jobs.push({
          id: jk || link.split('jk=')[1] || `${i}_${Date.now()}`,
          title: title,
          company,
          location,
          snippet,
          platform: 'indeed',
          platformUrl: normalizeUrl(baseUrl, link)
        });
      }
    });
  }

  // Deduplicate by id
  const seen = new Set();
  const unique = [];
  for (const j of jobs) {
    if (!seen.has(j.id)) {
      unique.push(j);
      seen.add(j.id);
    }
  }

  return unique;
}

// Search Indeed (simple scraping fallback)
router.get('/jobs/indeed/search', async (req, res) => {
  const q = req.query.q || req.query.keywords || 'software engineer';
  const l = req.query.l || req.query.location || 'remote';
  const page = Number(req.query.page || 0);

  try {
    const start = page * 10;
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&start=${start}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 15000
    });

    const jobs = parseIndeedSearch(response.data, 'https://www.indeed.com');

    // attach fake matchScore for demo
    const results = jobs.map((j) => ({ ...j, matchScore: Math.floor(70 + Math.random() * 25) }));

    // Broadcast event for WebSocket listeners (progress)
    try { process.emit('jobEvent', { type: 'indeed_search', q, l, resultsCount: results.length, timestamp: new Date().toISOString() }); } catch (e) {}

    return res.json({ ok: true, query: { q, l, page }, jobs: results, source: 'scrape' });
  } catch (err) {
    console.error('indeed search error', err.message || err);
    return res.status(500).json({ ok: false, error: 'indeed_search_failed', message: String(err.message || err) });
  }
});

// Job details
router.get('/jobs/indeed/job/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const url = `https://www.indeed.com/viewjob?jk=${encodeURIComponent(jobId)}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const description = $('#jobDescriptionText').text().trim() || $('.jobsearch-jobDescriptionText').text().trim() || '';
    const title = $('h1').first().text().trim() || $('h1.jobsearch-JobInfoHeader-title').text().trim();
    const company = $('.companyName').first().text().trim() || $('.icl-u-lg-mr--sm').text().trim();

    return res.json({ ok: true, job: { id: jobId, title, company, description, url } });
  } catch (err) {
    console.error('indeed job fetch error', err.message || err);
    return res.status(500).json({ ok: false, error: 'indeed_job_failed', message: String(err.message || err) });
  }
});

// Apply (simulate via event & async processing)
router.post('/jobs/indeed/apply', async (req, res) => {
  const { jobUrl, resumeId, coverLetter, formData } = req.body || {};
  if (!jobUrl) return res.status(400).json({ ok: false, error: 'missing_jobUrl' });

  const submissionId = `indeed_sub_${Date.now()}`;

  // Emit start
  process.emit('jobEvent', { type: 'indeed_apply_started', submissionId, jobUrl, resumeId, timestamp: new Date().toISOString() });

  // Simulate async apply process
  setTimeout(() => {
    const success = Math.random() > 0.2; // 80% success rate for simulation
    process.emit('jobEvent', { type: 'indeed_apply_completed', submissionId, jobUrl, success, timestamp: new Date().toISOString() });

    // Persist to simple file store
    try {
      const fs = await import('fs');
      const path = './server_applications.json';
      let store = [];
      if (fs.existsSync(path)) {
        store = JSON.parse(fs.readFileSync(path, 'utf8') || '[]');
      }
      store.unshift({ submissionId, jobUrl, resumeId, coverLetter: coverLetter ? '[REDACTED]' : null, success, ts: new Date().toISOString() });
      fs.writeFileSync(path, JSON.stringify(store, null, 2));
    } catch (e) {
      console.warn('persist application failed', e.message || e);
    }
  }, 3000 + Math.floor(Math.random() * 5000));

  return res.json({ ok: true, submissionId, status: 'pending' });
});

// List server-side applications
router.get('/applications/list', (req, res) => {
  try {
    const fs = require('fs');
    const path = './server_applications.json';
    if (!fs.existsSync(path)) return res.json({ applications: [] });
    const raw = fs.readFileSync(path, 'utf8') || '[]';
    const apps = JSON.parse(raw);
    return res.json({ applications: apps });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;