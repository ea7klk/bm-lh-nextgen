// Load environment variables
require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { initDatabase } = require('./db/database');
const { startScheduler } = require('./services/schedulerService');
const { startBrandmeisterService } = require('./services/brandmeisterService');
const lastheardRoutes = require('./routes/lastheard');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const talkgroupsRoutes = require('./routes/talkgroups');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Start scheduler for API key expiry checks and cleanup
startScheduler();

// Start Brandmeister websocket service
startBrandmeisterService();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth routes (public, no authentication required)
app.use('/api/auth', authRoutes);

// Admin routes (protected with admin password)
app.use('/admin', adminRoutes);

// API Routes (protected with API key authentication)
app.use('/api', lastheardRoutes);
app.use('/api', talkgroupsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Brandmeister Lastheard Next Generation API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
