import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

import router from './router';
import { configureWebSocketServer } from './websocket';

const port = process.env.PORT || 3005;

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000']
  })
);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something brokey!');
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

configureWebSocketServer(wss);

server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws);
  });
});

server.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
