import app from './server.js';
import { config } from './config/index.js';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
});
