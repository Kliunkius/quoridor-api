import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

import { iocContainer } from '../ioc/inversify.config';
import { TYPES } from '../ioc/types';
import { Websocket } from './Websocket/websocket';
import router from './router';

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

const websocket = iocContainer.get<Websocket>(TYPES.Websocket);

websocket.configureWebSocketServer(wss);

server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws);
  });
});

server.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
