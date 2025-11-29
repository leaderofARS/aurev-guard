import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import config from './config/index.js';
import routes from './routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request ID generator middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    requestId: req.requestId 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    requestId: req.requestId 
  });
});

const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;