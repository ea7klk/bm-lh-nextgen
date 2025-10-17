// Load environment variables
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { initDatabase } = require('./db/database');
const { startScheduler } = require('./services/schedulerService');
const { startBrandmeisterService } = require('./services/brandmeisterService');
const i18n = require('./config/i18n');
const { languageMiddleware } = require('./middleware/language');
const lastheardRoutes = require('./routes/lastheard');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const talkgroupsRoutes = require('./routes/talkgroups');
const publicRoutes = require('./routes/public');
const frontendRoutes = require('./routes/frontend');
const userRoutes = require('./routes/user');
const advancedRoutes = require('./routes/advanced');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(i18n.init);
app.use(languageMiddleware);

// Initialize database
(async () => {
  try {
    await initDatabase();
    
    // Start scheduler for API key expiry checks and cleanup
    startScheduler();

    // Start Brandmeister websocket service
    startBrandmeisterService();

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Frontend routes (public HTML pages)
    app.use('/', frontendRoutes);

    // Advanced functions (protected HTML page)
    app.use('/advanced', advancedRoutes);

    // Public API routes (no authentication required for viewing)
    app.use('/public', publicRoutes);

    // Auth routes (public, no authentication required)
    app.use('/api/auth', authRoutes);

    // User routes (public registration/login, some protected)
    app.use('/user', userRoutes);

    // Admin routes (protected with admin password)
    app.use('/admin', adminRoutes);

    // API Routes (protected with API key authentication)
    app.use('/api', lastheardRoutes);
    app.use('/api', talkgroupsRoutes);

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
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

module.exports = app;
