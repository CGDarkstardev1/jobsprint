#!/usr/bin/env node
/**
 * JobSprint Deployment to Puter.js
 * Uses Puter.js SDK directly for deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DIST_DIR = path.join(__dirname, 'dist');
const SUBDOMAIN = process.env.PUTER_SUBDOMAIN || 'jobsprint-app';

// Puter API endpoints
const API_BASE = 'api.puter.com';

async function deploy() {
  console.log('🚀 JobSprint Deployment to Puter.js');
  console.log('===================================\n');

  // Get API token from env or file
  let token = process.env.PUTER_API_KEY;

  if (!token) {
    try {
      token = fs
        .readFileSync('.env', 'utf8')
        .split('\n')
        .find((line) => line.startsWith('PUTER_API_KEY='))
        ?.split('=')[1]
        ?.trim();
    } catch (e) {}
  }

  if (!token) {
    console.log('❌ No Puter API key found!');
    console.log('Please:');
    console.log('1. Run: puter login --save');
    console.log('2. Or set PUTER_API_KEY environment variable');
    console.log('3. Or create .env file with PUTER_API_KEY=<your-token>');
    console.log('\nFor now, using browser-based deployment...');
    console.log('Open: deploy-to-puter.html in a browser');
    process.exit(1);
  }

  console.log(`✅ Found API token: ${token.substring(0, 10)}...`);

  // Read all files
  const files = getAllFiles(DIST_DIR);
  console.log(`📦 Found ${files.length} files to deploy\n`);

  // Create directory
  console.log('📁 Creating remote directory...');
  await apiRequest(`/fs/${SUBDOMAIN}`, 'PUT', null, token);

  // Upload files
  let uploaded = 0;
  for (const file of files) {
    const relativePath = path.relative(DIST_DIR, file.path);
    const remotePath = `${SUBDOMAIN}/${relativePath}`;

    console.log(`📤 Uploading: ${relativePath}`);
    await apiRequest(`/fs${remotePath}`, 'PUT', file.content, token, {
      'Content-Type': 'text/plain',
    });

    uploaded++;
    const percent = Math.round((uploaded / files.length) * 100);
    process.stdout.write(`\r   Progress: ${percent}% (${uploaded}/${files.length})`);
  }
  console.log('\n');

  // Deploy as site
  console.log('🌐 Publishing as website...');
  const result = await apiRequest(`/hosting/${SUBDOMAIN}`, 'POST', null, token);

  console.log('\n✅ Deployment Complete!');
  console.log(`   URL: https://${SUBDOMAIN}.puter.site`);
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push({
        path: fullPath,
        content: fs.readFileSync(fullPath, 'utf8'),
      });
    }
  }
  return files;
}

function apiRequest(endpoint, method, body, token, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

deploy().catch((err) => {
  console.error('❌ Deployment failed:', err.message);
  process.exit(1);
});
