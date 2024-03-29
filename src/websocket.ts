import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import {
  Coordinates,
  MAX_PLAYER_COUNT,
  PLAYER1_STARTING_POSITION,
  PLAYER2_STARTING_POSITION,
  SquareType,
  getPlayerCoordinates,
  movePiece,
  roomsMap,
  usersMap
} from './boardHelper';
import { Message, MessageTypes } from './websocketTypes';
import { getRoomByUserId, isRoomReady } from './websocketHelper';
import { updatePlayerMoves } from './calculatePlayerMoves';

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
    case MessageTypes.JOIN_ROOM: {
      const userId: string = uuidv4();
      ws.userId = userId;

      // this gets passed from UI
      const roomCode: string = parsedData.roomCode;
      // const name = parsedData.name;
      const room = roomsMap[roomCode];
      if (_.isEmpty(room)) {
        ws.send(formatMessage(MessageTypes.ROOM_DELETED, {}));
        return;
      }

      const playerCount = Object.keys(room.playerMap).length;
      if (playerCount === MAX_PLAYER_COUNT) {
        // we can probably sent message like room full, but for now it has the same functionality as ROOM_DELETED
        ws.send(formatMessage(MessageTypes.ROOM_DELETED, {}));
        return;
      }

      const coordinates = _.isEmpty(room.playerMap) ? PLAYER1_STARTING_POSITION : PLAYER2_STARTING_POSITION;

      // add player to the users map
      usersMap[userId] = { ws, userId, roomCode };

      // add player to the room
      room.playerMap[userId] = { coordinates, ready: false, name: userId };

      // user gets placed on the starting square
      const square = room.board[coordinates.y].squares[coordinates.x];
      if (square.type === SquareType.Player) {
        square.playerId = userId;
      }

      const clientIds = Object.keys(room.playerMap);

      for (const clientId of clientIds) {
        const client = usersMap[clientId];
        let otherPlayer;
        for (const [playerId, player] of Object.entries(room.playerMap)) {
          if (playerId === clientId) {
            continue;
          }
          otherPlayer = { ready: player.ready, name: player.name };
          break;
        }
        client.ws.send(
          formatMessage(MessageTypes.JOIN_ROOM, {
            userId: clientId,
            // yourName: room.playerMap[clientId].name,
            yourName: clientId,
            board: room.board,
            otherPlayer
          })
        );
      }

      break;
    }

    case MessageTypes.READY: {
      const userId = ws.userId;
      const room = getRoomByUserId(userId);
      room.playerMap[userId].ready = true;

      if (!isRoomReady(room)) {
        return;
      }

      const clientIds = Object.keys(room.playerMap);
      const random = Math.round(Math.random());
      const playerIdToMove = clientIds[random];

      if (_.isEmpty(room.playerIdToMove)) {
        room.playerIdToMove = playerIdToMove;
      }

      const coordinatesPlayer = getPlayerCoordinates(playerIdToMove, room.board);
      updatePlayerMoves(coordinatesPlayer, room.board);

      for (const clientId of clientIds) {
        const client = usersMap[clientId];
        client.ws.send(formatMessage(MessageTypes.READY, { yourTurn: clientId === playerIdToMove, board: room.board }));
      }

      break;
    }

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

      ws.send(
        formatMessage(MessageTypes.RECONNECT, { board: pastRoom.board, yourTurn: userId === pastRoom.playerIdToMove })
      );

      break;
    }

    case MessageTypes.MOVE: {
      const coordinates: Coordinates = parsedData.coordinates;
      const type: SquareType = parsedData.type;
      const userId = ws.userId;
      const room = getRoomByUserId(userId);

      if (!isRoomReady(room)) {
        // probably send some message that player is cheating
        return;
      }

      const clientIds = Object.keys(room.playerMap);

      const newPlayerToMove = _.find(clientIds, (id) => id !== userId);
      room.playerIdToMove = newPlayerToMove;

      movePiece({ coordinates, type, userId });

      const coordinatesEnemy = getPlayerCoordinates(newPlayerToMove, room.board);
      updatePlayerMoves(coordinatesEnemy, room.board);

      for (const clientId of clientIds) {
        const client = usersMap[clientId];
        client.ws.send(
          formatMessage(MessageTypes.MOVE, { board: room.board, yourTurn: clientId === room.playerIdToMove })
        );
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
  const user = usersMap[userId];
  if (!userId || !user) {
    return;
  }

  const deletePlayer = () => {
    const roomCode = usersMap[userId].roomCode;
    delete roomsMap[roomCode].playerMap[userId];
    delete usersMap[userId];
  };

  // delete user completely after 60 seconds
  const interval = setTimeout(deletePlayer, 1000 * 60);

  user.interval = interval;
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
