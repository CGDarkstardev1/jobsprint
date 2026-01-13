/**
 * Puter.js Integration Script
 * Adds Puter.js SDK to the frontend for cloud features
 */

// Check if Puter.js is available
if (typeof window.puter !== 'undefined') {
  // Puter.js is loaded - add global access for easy debugging
  window.puterCloud = window.puter;
  window.puterAI = window.puter;
  window.puterFS = window.puter;
  window.puterAuth = window.puter;

  console.log('✅ Puter.js SDK loaded and initialized');
} else {
  console.warn('⚠️ Puter.js SDK not detected. Cloud features will be simulated.');
}
