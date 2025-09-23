// Configuration file for Smart Planner
// Copy this file to config.js and set your actual values

// OpenAI API key for AI chat feature
// Get your API key from: https://platform.openai.com/api-keys
window.OPENAI_API_KEY = 'your-openai-api-key-here';

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