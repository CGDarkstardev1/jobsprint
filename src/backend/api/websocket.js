/**
 * Simple WebSocket server for streaming job progress and events to connected clients
 * Uses 'ws' npm package and listens for events published on process events
 */

import WebSocket, { WebSocketServer } from 'ws';

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });
  console.log('[WebSocket] Server initialized');

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', (message) => {
      console.log('[WebSocket] Received message from client:', message.toString());
    });

    ws.send(JSON.stringify({ type: 'welcome', ts: new Date().toISOString() }));

    // Example: listen to process events
    const handler = (event) => {
      try {
        ws.send(JSON.stringify(event));
      } catch (e) {
        console.warn('[WebSocket] Send failed:', e.message);
      }
    };

    process.on('jobEvent', handler);

    ws.on('close', () => {
      process.off('jobEvent', handler);
      console.log('[WebSocket] Client disconnected');
    });
  });

  return wss;
}
