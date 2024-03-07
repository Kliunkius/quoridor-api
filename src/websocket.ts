import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import {
  Coordinates,
  PLAYER1_STARTING_POSITION,
  PLAYER2_STARTING_POSITION,
  SquareType,
  UserRole,
  clientsMap,
  movePiece,
  roomsMap,
  usersMap
} from './boardHelper';
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
      const userId: string = uuidv4();
      ws.userId = userId;
      clientsMap[userId] = { ws };

      const roomCode = parsedData.roomCode;

      const isRoomEmpty = _.isEmpty(roomsMap[roomCode].playerMap);
      const role = isRoomEmpty ? UserRole.PLAYER1 : UserRole.PLAYER2;
      const coordinates = isRoomEmpty ? PLAYER1_STARTING_POSITION : PLAYER2_STARTING_POSITION;
      roomsMap[roomCode].playerMap[userId] = { role, coordinates };

      ws.send(
        formatMessage(MessageTypes.JOIN_ROOM, { board: roomsMap[roomCode].board, role: UserRole.PLAYER2, userId })
      );

      break;
    }
    case MessageTypes.MOVE: {
      const coordinates: Coordinates = parsedData.coordinates;
      const type: SquareType = parsedData.type;
      const userId = ws.userId;

      movePiece({ coordinates, type, userId });

      const roomCode = usersMap[userId].roomCode;
      const clientIds = Object.keys(roomsMap[roomCode].playerMap);

      for (const clientId of clientIds) {
        ws.send(formatMessage(MessageTypes.MOVE, { board: roomsMap[roomCode].board, role: usersMap[clientId].role }));
      }

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
