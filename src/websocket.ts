import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { UserRole, roomsMap, usersMap } from './globals';
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
    // when fresh user is creating room
    case MessageTypes.CONNECT: {
      console.log('CONNECTING');
      const userId: string = uuidv4();
      ws.userId = userId;
      ws.send(formatMessage(MessageTypes.CONNECT, { userId }));

      break;
    }
    // when user reloaded the page and already has the userId cookie saved
    case MessageTypes.RECONNECT: {
      const userId: string = parsedData.userId;

      const user = usersMap[userId];
      if (!user) {
        break;
      }

      ws.userId = user.playerId;
      roomsMap[user.roomCode][user.role] = user.playerId;
      // send message for updating notifying players that reconnect is complete

      break;
    }
    case MessageTypes.JOIN_ROOM: {
      const roomCode = parsedData.roomCode;

      roomsMap[roomCode] = { ...roomsMap[roomCode], player2Id: ws.userId };
      // send message for user to join the room

      break;
    }
    case MessageTypes.CREATE_ROOM: {
      const roomCode = parsedData.roomCode;
      roomsMap[roomCode] = { board: createNewBoard(), player1Id: ws.userId };
      usersMap[ws.userId] = { playerId: ws.userId, roomCode, role: UserRole.PLAYER1 };
      // send message for user to join the room

      break;
    }
    case MessageTypes.CHECK_STATUS: {
      const user = usersMap[ws.userId];
      const room = roomsMap[user.roomCode];

      ws.send(formatMessage(MessageTypes.CHECK_STATUS, { userId: ws.userId, user, room }));

      break;
    }
    case MessageTypes.DEV_INFO: {
      ws.send(formatMessage(MessageTypes.DEV_INFO, { usersMap, roomsMap }));

      break;
    }
    default: {
      console.log(`Sorry, the type ${parsedMessage.type} is not handled`);
    }
  }
};

export const configureWebSocketServer = (wss: WebSocketServer) => {
  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.on('message', (data) => {
      handleMessage(data, ws);
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
  });
};
