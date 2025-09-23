const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { syncDatabase } = require('./server/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
syncDatabase();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
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

// API Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/events', require('./server/routes/events'));
app.use('/api/todos', require('./server/routes/todos'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Planner API is running' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Planner server running on port ${PORT}`);
  console.log(`📅 Access your app at http://localhost:${PORT}`);
  console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
});
