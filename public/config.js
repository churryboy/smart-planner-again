// Configuration file for Smart Planner - Client-side
// This file will be populated by the server with environment variables

// OpenAI API key - will be loaded from server endpoint
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

// Load configuration from server
fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    window.OPENAI_API_KEY = config.openaiApiKey;
    console.log('📱 Smart Planner configuration loaded from server');
  })
  .catch(error => {
    console.log('📱 Smart Planner configuration loaded (fallback)');
  });
