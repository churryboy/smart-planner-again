const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database only if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  const { syncDatabase } = require('./server/models');
  syncDatabase();
  
  // API Routes (only if database is available)
  app.use('/api/auth', require('./server/routes/auth'));
  app.use('/api/events', require('./server/routes/events'));
  app.use('/api/todos', require('./server/routes/todos'));
} else {
  console.log('⚠️  No DATABASE_URL found - running in static mode');
  console.log('📝 User data will be stored locally in browser');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Planner API is running',
    mode: process.env.DATABASE_URL ? 'dynamic' : 'static'
  });

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});});

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});
// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});});

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});
app.listen(PORT, () => {
  console.log(`🚀 Smart Planner server running on port ${PORT}`);
  console.log(`📅 Access your app at http://localhost:${PORT}`);
  console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
  if (!process.env.DATABASE_URL) {
    console.log('💡 To enable user accounts, set DATABASE_URL environment variable');
  }
});

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    openaiApiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
  });
});