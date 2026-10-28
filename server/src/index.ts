import config from './config';
import { createApp } from './app';
import { pool } from './db/pool';

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`Beacon API listening on http://localhost:${config.port} (${config.env})`);
});

// Graceful shutdown so in-flight requests finish and DB connections close cleanly.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down…`);
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
