const app = require('./app');
const connectDB = require('./config/databaseConfig');
const { PORT } = require('./config/envConfig');

// Import passport configuration
require('./config/passportConfig');

const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoltPath Node.js server running on port ${PORT}`);
  });
};

startServer().catch(console.error);
