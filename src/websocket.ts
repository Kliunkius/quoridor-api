import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { roomsMap, usersMap } from './globals';
import { createNewBoard } from './boardHelper';
import { MessageTypes } from './websocketTypes';

type ExtendedWebSocket = WebSocket & {
  userId: string;
};

export const configureWebSocketServer = (wss: WebSocketServer) => {
  wss.on('connection', (ws: ExtendedWebSocket, userId: string, roomCode: string) => {
    ws.on('message', async (data) => {
      console.log('guga', data.toString());
      ws.send('I gots your message cuh');
    });

    ws.on('error', (err) => {
      console.log('GOD DAMN I DID NOT EXPECT THAT! ' + err);
    });

    ws.on('close', (code, reason) => {
      console.log('WebSocket server closed lamo: ', code, reason);
    });

    ws.on('error', () => {
      console.log('oi ble');
    });

    if (roomCode) {
      const userId = uuidv4();
      roomsMap[roomCode] = { board: createNewBoard(), player1Id: userId };
      usersMap[userId] = { playerId: userId, roomCode };
      ws.userId = userId;
      ws.send(JSON.stringify({ type: MessageTypes, message: { userId } }));
    }
  });
};
