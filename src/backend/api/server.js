/**
 * Jobsprint API Server
 * Express.js backend server for REST API
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Basic API info
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Jobsprint API',
    version: '1.0.0',
    description: 'AI-powered automation platform API',
  });
});

// Register routers (connectors, oauth, documents, ai)
import connectorsRouter from './connectors.js';
import googleOAuthRouter from './googleOAuth.js';
import documentsRouter from './documents.js';
import aiRouter from './ai.js';

app.use('/api/v1', connectorsRouter);
app.use('/api/v1', googleOAuthRouter);
app.use('/api/v1', documentsRouter);
app.use('/api/v1', aiRouter);

// Create HTTP server and websocket server
import { initWebSocket } from './websocket.js';
const server = http.createServer(app);
const wss = initWebSocket(server);

server.listen(PORT, () => console.log(`🚀 Jobsprint API server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close();
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jobsprint API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
