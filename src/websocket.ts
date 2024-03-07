import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import {
  Coordinates,
  PLAYER1_STARTING_POSITION,
  PLAYER2_STARTING_POSITION,
  SquareType,
  UserRole,
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
    case MessageTypes.RECONNECT: {
      // userId comes from UI, saved in cookies
      const userId: string = parsedData.userId;

      // get user if he was not yet deleted
      const pastUser = usersMap[userId];

      // if user is already deleted, send message and that's it
      if (!pastUser) {
        ws.send(formatMessage(MessageTypes.ROOM_DELETED, {}));
        return;
      }

      // get room if it was not yet deleted
      const pastRoom = roomsMap[pastUser.roomCode];

      // if room is already deleted, send message and that's it
      if (!pastRoom) {
        ws.send(formatMessage(MessageTypes.ROOM_DELETED, {}));
        return;
      }

      // clear interval for deleting room and user after 60 seconds
      clearTimeout(pastUser.interval);
      delete pastUser.interval;

      // reassign new websocket instance
      pastUser.ws = ws;
      ws.userId = pastUser.userId;

      ws.send(formatMessage(MessageTypes.RECONNECT, { board: pastRoom.board, role: pastUser.role }));

      break;
    }
    case MessageTypes.JOIN_ROOM: {
      const userId: string = uuidv4();
      ws.userId = userId;

      // this gets passed from UI
      const roomCode = parsedData.roomCode;

      // if room is empty, user gets assigned PLAYER1 role
      const isRoomEmpty = _.isEmpty(roomsMap[roomCode].playerMap);
      const role = isRoomEmpty ? UserRole.PLAYER1 : UserRole.PLAYER2;
      const coordinates = isRoomEmpty ? PLAYER1_STARTING_POSITION : PLAYER2_STARTING_POSITION;

      // add player to the users map
      usersMap[userId] = { ws, userId, roomCode, role };

      // add player to the room
      roomsMap[roomCode].playerMap[userId] = { role, coordinates };

      // user gets placed on the starting square
      const square = roomsMap[roomCode].board[coordinates.y].squares[coordinates.x];
      if (square.type === SquareType.Player) {
        square.playerId = userId;
      }

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
  const userId = ws.userId;
  if (!userId) {
    return;
  }

  const deletePlayer = () => {
    const roomCode = usersMap[userId].roomCode;
    delete roomsMap[roomCode].playerMap[userId];
    delete usersMap[userId];
  };

  // delete user completely after 60 seconds
  const interval = setTimeout(deletePlayer, 1000 * 60);

  usersMap[userId].interval = interval;
};

export const configureWebSocketServer = (wss: WebSocketServer) => {
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('Websocket connected');

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
