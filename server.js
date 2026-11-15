import express from 'express';
import { logger } from './lib/utils.js';

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Pengauthor Bot</title>
      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #202020;
          color: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 1.5rem;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <p>Nani?? The bot is alive! Pengauthor Bot kawaii!!</p>
    </body>
    </html>
  `);
});

export function startServer() {
  app.listen(port, '0.0.0.0', () => {
    logger.info(`Started Express server (port ${port})`);
  });
}
