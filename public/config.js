// Configuration file for Smart Planner - Production Safe
// This file contains no sensitive information and is safe to commit

// OpenAI API key - will be loaded from environment or set to placeholder
window.OPENAI_API_KEY = window.OPENAI_API_KEY || 'your-api-key-here';

// App configuration
window.APP_CONFIG = {
  // Disable authentication for demo/static mode
  requireAuth: false,
  
  // App name
  appName: 'Smart Planner',
  
  // Default user for static mode
  defaultUser: {
    id: 'local-user',
    name: '사용자',
    email: 'user@local.com'
  }
};

console.log('📱 Smart Planner configuration loaded (production safe)');
