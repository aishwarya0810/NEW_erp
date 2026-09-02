import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database before starting Express server listeners
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Graceful shutdown handling
  const handleSystemError = (error: Error, type: string) => {
    console.error(`[CRITICAL] ${type} detected! Shutting down server gracefully...`);
    console.error(error.stack || error.message);
    server.close(() => {
      console.log('Server process terminated.');
      process.exit(1);
    });
  };

  process.on('unhandledRejection', (err: Error) => {
    handleSystemError(err, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (err: Error) => {
    handleSystemError(err, 'Uncaught Exception');
  });
};

startServer();
