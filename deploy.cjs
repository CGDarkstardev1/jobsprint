/**
 * JobSprint Deployment Script for Puter.js
 *
 * This script deploys the JobSprint static site to Puter.js hosting.
 *
 * Usage:
 *   node deploy.js [--subdomain=<subdomain>]
 *
 * Options:
 *   --subdomain  The subdomain for your site (default: jobsprint-app)
 *
 * Requirements:
 *   - Puter.js SDK loaded (<script src="https://js.puter.com/v2/"></script>)
 *   - User must be logged in to Puter.com
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DIST_DIR = path.join(__dirname, 'dist');
const DEFAULT_SUBDOMAIN = 'jobsprint-app';

async function deploy() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let subdomain = DEFAULT_SUBDOMAIN;

  for (const arg of args) {
    if (arg.startsWith('--subdomain=')) {
      subdomain = arg.split('=')[1];
    }
  }

  console.log('🚀 JobSprint Deployment Script');
  console.log('================================');
  console.log(`📦 Deploying from: ${DIST_DIR}`);
  console.log(`🌐 Target subdomain: ${subdomain}`);
  console.log('');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Error: dist directory not found!');
    console.log('Please run the build first: npm run build');
    process.exit(1);
  }

  // Read all files from dist directory
  const files = getAllFiles(DIST_DIR);
  console.log(`📄 Found ${files.length} files to deploy`);
  console.log('');

  // Generate deployment HTML
  const deployScript = generateDeployScript(files, subdomain);

  // Write deployment script
  const deployHtmlPath = path.join(DIST_DIR, 'deploy-to-puter.html');
  fs.writeFileSync(deployHtmlPath, deployScript);

  console.log('✅ Deployment files prepared!');
  console.log('');
  console.log('📋 To complete deployment:');
  console.log('');
  console.log('   OPTION 1: Drag & Drop (Recommended)');
  console.log('   1. Go to https://puter.com');
  console.log('   2. Sign in to your account');
  console.log('   3. Drag the "dist" folder onto the Puter desktop');
  console.log('   4. Right-click the uploaded folder');
  console.log('   5. Select "Publish as Website"');
  console.log('   6. Choose a subdomain and click "Publish"');
  console.log('');
  console.log('   OPTION 2: Using Puter.js API');
  console.log('   1. Open deploy-to-puter.html in a browser');
  console.log('   2. Follow the prompts to authorize deployment');
  console.log('');
  console.log(`🌍 Your site will be available at: https://${subdomain}.puter.site`);
  console.log('');
  console.log(
    '📝 Note: The deploy-to-puter.html file is temporary and can be deleted after deployment.'
  );
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push({
        path: filePath,
        relativePath: path.relative(DIST_DIR, filePath),
        content: fs.readFileSync(filePath, 'utf8'),
      });
    }
  });

  return arrayOfFiles;
}

function generateDeployScript(files, subdomain) {
  const fileList = files.map((f) => ({
    path: f.relativePath,
    content: f.content,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deploy JobSprint to Puter.js</title>
    <script src="https://js.puter.com/v2/"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .status { 
            padding: 15px; 
            margin: 20px 0;
            border-radius: 5px;
        }
        .status-info { background: #e3f2fd; color: #1565c0; }
        .status-success { background: #e8f5e9; color: #2e7d32; }
        .status-error { background: #ffebee; color: #c62828; }
        button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .log {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 13px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        .progress {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #10b981);
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Deploy JobSprint to Puter.js</h1>
        
        <div id="status" class="status status-info">
            Please sign in to Puter.com to continue...
        </div>
        
        <div class="progress" id="progress-container" style="display:none">
            <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        </div>
        
        <div id="log" class="log" style="display:none"></div>
        
        <button id="deploy-btn" style="display:none" onclick="startDeployment()">
            🚀 Deploy Now
        </button>
    </div>

    <script>
        const subdomain = '${subdomain}';
        const totalFiles = ${fileList.length};
        
        async function checkLogin() {
            try {
                const user = await puter.auth.getUser();
                document.getElementById('status').className = 'status status-success';
                document.getElementById('status').textContent = 
                    '✅ Signed in as: ' + user.username + '\\nClick "Deploy Now" to continue.';
                document.getElementById('deploy-btn').style.display = 'inline-block';
            } catch (e) {
                document.getElementById('status').textContent = 
                    '❌ Please sign in to Puter.com first:\\n1. Go to https://puter.com\\n2. Sign in or create account\\n3. Return to this page';
            }
        }
        
        function log(message) {
            const logEl = document.getElementById('log');
            logEl.style.display = 'block';
            logEl.textContent += message + '\\n';
            logEl.scrollTop = logEl.scrollHeight;
        }
        
        async function startDeployment() {
            document.getElementById('deploy-btn').style.display = 'none';
            document.getElementById('progress-container').style.display = 'block';
            document.getElementById('status').className = 'status status-info';
            document.getElementById('status').textContent = 'Creating directory...';
            
            try {
                // Create directory
                const dirName = subdomain;
                await puter.fs.mkdir(dirName);
                log('✅ Created directory: /' + dirName);
                
                // Upload files
                const files = ${JSON.stringify(fileList)};
                let uploaded = 0;
                
                for (const file of files) {
                    const remotePath = dirName + '/' + file.path;
                    await puter.fs.write(remotePath, file.content);
                    uploaded++;
                    const percent = Math.round((uploaded / totalFiles) * 100);
                    document.getElementById('progress-bar').style.width = percent + '%';
                    log('📤 Uploaded: ' + file.path + ' (' + percent + '%)');
                }
                
                log('\\n✅ All ' + totalFiles + ' files uploaded!');
                document.getElementById('status').className = 'status status-success';
                document.getElementById('status').textContent = 'Publishing as website...';
                
                // Deploy
                const site = await puter.hosting.create(subdomain, dirName);
                
                log('\\n🎉 Deployment successful!');
                log('🌐 Your site is live at: https://' + subdomain + '.puter.site');
                
                document.getElementById('status').innerHTML = 
                    '<strong>🎉 Deployment Complete!</strong><br><br>' +
                    'Your JobSprint app is now live at:<br>' +
                    '<a href="https://' + subdomain + '.puter.site" target="_blank" style="color: #4f46e5; font-size: 18px;">https://' + subdomain + '.puter.site</a>';
                    
            } catch (e) {
                log('\\n❌ Error: ' + e.message);
                document.getElementById('status').className = 'status status-error';
                document.getElementById('status').textContent = 'Deployment failed: ' + e.message;
                document.getElementById('deploy-btn').style.display = 'inline-block';
                document.getElementById('deploy-btn').textContent = 'Retry Deployment';
            }
        }
        
        // Check login on page load
        window.onload = checkLogin;
    </script>
</body>
</html>`;
}

// Run deployment
deploy().catch(console.error);
