/**
 * Puter.js Deployment Service
 * Handles building and deploying frontend to Puter.js platform
 */

// Type declaration for Puter.js global
declare global {
  interface Window {
    puter?: {
      getSiteUrl(): Promise<string>;
      deploy(): Promise<void>;
    };
  }
}

export class DeploymentService {
  /**
   * Build the frontend for production
   */
  async build(): Promise<void> {
    console.log('🔨 Building frontend for Puter.js deployment...');

    try {
      // Run build command
      const { execSync } = require('child_process');
      const buildResult = execSync('npm run build', {
        cwd: '/home/chris/dev/jobsprint/src/frontend',
        stdio: 'inherit',
      });

      if (buildResult.error) {
        console.error('❌ Build failed:', buildResult.error);
        throw new Error(`Build failed: ${buildResult.error}`);
      }

      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build error:', error);
      throw error;
    }
  }

  /**
   * Deploy to Puter.js
   */
  async deploy(): Promise<void> {
    console.log('🚀 Deploying to Puter.js platform...');

    try {
      // Use Puter.js CLI for deployment (if available)
      if (typeof window !== 'undefined' && window.puter) {
        const { execSync } = require('child_process');
        const deployResult = execSync('npx puter deploy', {
          stdio: 'inherit',
        });

        if (deployResult.error) {
          console.error('❌ Deployment failed:', deployResult.error);
          throw new Error(`Deployment failed: ${deployResult.error}`);
        }

        console.log('✅ Deployed to Puter.js successfully');
        console.log('🌐 Your JobSprint app is now live at:', await window.puter.getSiteUrl());
      } else {
        console.log('⚠️ Puter.js CLI not available. Manual deployment required.');
        console.log(
          'Please upload the dist/ folder to your Puter.js account and publish as a website.'
        );
      }
    } catch (error) {
      console.error('❌ Deployment error:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(): Promise<void> {
    if (typeof window !== 'undefined' && window.puter) {
      const siteUrl = await window.puter.getSiteUrl();
      console.log(`📊 Current deployment: ${siteUrl}`);
    } else {
      console.log('❌ Puter.js not available');
    }
  }

  /**
   * Setup development environment
   */
  async setupDev(): Promise<void> {
    console.log('🔧 Setting up development environment...');

    // Install dependencies
    const { execSync } = require('child_process');
    const installResult = execSync('npm install', {
      stdio: 'inherit',
      cwd: '/home/chris/dev/jobsprint/src/frontend',
    });

    if (installResult.error) {
      console.error('❌ Setup failed:', installResult.error);
      throw new Error(`Setup failed: ${installResult.error}`);
    }

    console.log('✅ Development environment setup completed');
  }
}

export const deploymentService = new DeploymentService();
