import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { UserRole, clientsMap, roomsMap, usersMap } from './globals';
import { createNewBoard } from './boardHelper';
import { Message, MessageTypes } from './websocketTypes';

type ExtendedWebSocket = WebSocket & {
  userId: string;
};

const formatMessage = (type: MessageTypes, data: any) => {
  return JSON.stringify({ type, data });
};

const handleMessage = (data, ws: ExtendedWebSocket) => {
  const parsedMessage: Message = JSON.parse(data);
  const parsedData = parsedMessage.data;

  switch (parsedMessage.type) {
    // when user
    case MessageTypes.CONNECT: {
      const userId: string = uuidv4();
      ws.userId = userId;
      clientsMap[userId] = { ws };
      ws.send(formatMessage(MessageTypes.CONNECT, { userId }));

      break;
    }
    // when user reloaded the page and already has the userId cookie saved
    case MessageTypes.RECONNECT: {
      const userId: string = parsedData.userId;

      const client = clientsMap[userId];
      if (client) {
        clearTimeout(client.interval);
        delete client.interval;
      }

      const user = usersMap[userId];
      if (!user) {
        // probably disconnect here
        break;
      }

      const room = roomsMap[user.roomCode];
      if (!room) {
        // probably disconnect here
        break;
      }

      ws.userId = user.playerId;
      roomsMap[user.roomCode][user.role] = user.playerId;
      // send message for updating notifying players that reconnect is complete

      break;
    }
    // when user joins by entering direct url
    case MessageTypes.JOIN_ROOM: {
      const roomCode = parsedData.roomCode;

      roomsMap[roomCode].playerMap[ws.userId] = UserRole.PLAYER2;

      ws.send(formatMessage(MessageTypes.JOIN_ROOM, { board: roomsMap[roomCode].board, role: UserRole.PLAYER2 }));

      break;
    }
    // user will first connect normally, and only then create game
    case MessageTypes.CREATE_ROOM: {
      const roomCode = parsedData.roomCode;
      roomsMap[roomCode] = { board: createNewBoard(), playerMap: { [ws.userId]: UserRole.PLAYER1 } };
      usersMap[ws.userId] = { playerId: ws.userId, roomCode, role: UserRole.PLAYER1 };

      ws.send(formatMessage(MessageTypes.CREATE_ROOM, { board: roomsMap[roomCode].board, role: UserRole.PLAYER1 }));
      break;
    }
    case MessageTypes.CHECK_STATUS: {
      const user = usersMap[ws.userId];
      const room = roomsMap[user.roomCode];

      ws.send(formatMessage(MessageTypes.CHECK_STATUS, { userId: ws.userId, user, room }));

      break;
    }
    case MessageTypes.DEV_INFO: {
      for (const [userId, client] of Object.entries(clientsMap)) {
        client.ws.send(formatMessage(MessageTypes.DEV_INFO, { userId }));
      }
      ws.send(formatMessage(MessageTypes.DEV_INFO, { id: ws.userId }));

      break;
    }
    case MessageTypes.UPDATE_BOARD: {
      for (const [userId, client] of Object.entries(clientsMap)) {
        client.ws.send(formatMessage(MessageTypes.DEV_INFO, { userId }));
      }
      ws.send(formatMessage(MessageTypes.DEV_INFO, { id: ws.userId }));

      break;
    }
    default: {
      console.log(`Sorry, the type ${parsedMessage.type} is not handled`);
    }
  }
};

const handleClose = (ws: ExtendedWebSocket) => {
  // user has 1 minute to reconnect
  const interval = setTimeout(() => {
    delete clientsMap[ws.userId];
    delete usersMap[ws.userId];
  }, 1000 * 60);
  clientsMap[ws.userId].interval = interval;
};

export const configureWebSocketServer = (wss: WebSocketServer) => {
  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.on('message', (data) => {
      handleMessage(data, ws);
    });

    ws.on('error', (err) => {
      console.log(`WebSocket closed with error: ${err}`);
    });

    ws.on('close', (code, reason) => {
      handleClose(ws);
      console.log(`WebSocket closed with code: ${code} and reason: ${reason.toString()}`);
    });
  });
};
