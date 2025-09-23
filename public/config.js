// Configuration file for Smart Planner
// This file sets up the configuration for the Smart Planner app

// OpenAI API key should be set via environment variables or server-side
// For local development, you can set it manually here (not recommended for production)
window.OPENAI_API_KEY = window.OPENAI_API_KEY || 'your-api-key-here';

// App configuration
window.APP_CONFIG = {
  // Set to false to disable authentication and use localStorage instead
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

console.log('📱 Smart Planner configuration loaded');
