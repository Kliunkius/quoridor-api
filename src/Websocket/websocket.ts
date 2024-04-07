import _ from 'lodash';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { BoardHelper } from '../BoardHelper/boardHelper';
import { Message, MessageTypes } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { Coordinates, ExtendedWebSocket, SquareType } from '../StateHandler/types';
import { MAX_PLAYER_COUNT, PLAYER1_STARTING_POSITION, PLAYER2_STARTING_POSITION } from '../BoardHelper/types';
import { PlayerMoveCalculator } from '../PlayerMoveCalculator/playerMoveCalculator';

@injectable()
export class Websocket {
  constructor(
    @inject(TYPES.BoardHelper) private boardHelper: BoardHelper,
    @inject(TYPES.StateHandler) private stateHandler: StateHandler,
    @inject(TYPES.PlayerMoveCalculator) private playerMoveCalculator: PlayerMoveCalculator
  ) {}

  formatMessage(type: MessageTypes, data: any) {
    return JSON.stringify({ type, data });
  }

  handleMessage(data, ws: ExtendedWebSocket) {
    const parsedMessage: Message = JSON.parse(data);
    const parsedData = parsedMessage.data;

    switch (parsedMessage.type) {
      case MessageTypes.JOIN_ROOM: {
        const userId: string = uuidv4();
        ws.userId = userId;

        // this gets passed from UI
        const roomCode: string = parsedData.roomCode;
        // const name = parsedData.name;
        const room = this.stateHandler.getRoom(roomCode);
        if (_.isEmpty(room)) {
          ws.send(this.formatMessage(MessageTypes.ROOM_DELETED, {}));
          return;
        }

        const playerCount = Object.keys(room.playerMap).length;
        if (playerCount === MAX_PLAYER_COUNT) {
          // we can probably sent message like room full, but for now it has the same functionality as ROOM_DELETED
          ws.send(this.formatMessage(MessageTypes.ROOM_DELETED, {}));
          return;
        }

        const coordinates = _.isEmpty(room.playerMap) ? PLAYER1_STARTING_POSITION : PLAYER2_STARTING_POSITION;

        // add player to the users map
        this.stateHandler.setUser(userId, { ws, userId, roomCode });

        // add player to the room
        room.playerMap[userId] = { coordinates, ready: false, name: userId };

        // user gets placed on the starting square
        const square = room.board[coordinates.y].squares[coordinates.x];
        if (square.type === SquareType.Player) {
          square.playerId = userId;
        }

        const clientIds = Object.keys(room.playerMap);

        for (const clientId of clientIds) {
          const client = this.stateHandler.getUser(clientId);
          let otherPlayer;
          for (const [playerId, player] of Object.entries(room.playerMap)) {
            if (playerId === clientId) {
              continue;
            }
            otherPlayer = { ready: player.ready, name: player.name };
            break;
          }
          client.ws.send(
            this.formatMessage(MessageTypes.JOIN_ROOM, {
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
        const room = this.boardHelper.getRoomByUserId(userId);
        room.playerMap[userId].ready = true;

        if (!this.boardHelper.isRoomReady(room)) {
          return;
        }

        const clientIds = Object.keys(room.playerMap);
        const random = Math.round(Math.random());
        const playerIdToMove = clientIds[random];

        if (_.isEmpty(room.playerIdToMove)) {
          room.playerIdToMove = playerIdToMove;
        }

        const coordinatesPlayer = this.boardHelper.getPlayerCoordinates(playerIdToMove, room.board);
        this.playerMoveCalculator.updatePlayerMoves(coordinatesPlayer, room.board);

        for (const clientId of clientIds) {
          const client = this.stateHandler.getUser(clientId);
          client.ws.send(
            this.formatMessage(MessageTypes.READY, { yourTurn: clientId === playerIdToMove, board: room.board })
          );
        }

        break;
      }

      case MessageTypes.RECONNECT: {
        // userId comes from UI, saved in cookies
        const userId: string = parsedData.userId;

        // get user if he was not yet deleted
        const pastUser = this.stateHandler.getUser(userId);

        // if user is already deleted, send message and that's it
        if (!pastUser) {
          ws.send(this.formatMessage(MessageTypes.ROOM_DELETED, {}));
          return;
        }

        // get room if it was not yet deleted
        const pastRoom = this.stateHandler.getRoom(pastUser.roomCode);

        // if room is already deleted, send message and that's it
        if (!pastRoom) {
          ws.send(this.formatMessage(MessageTypes.ROOM_DELETED, {}));
          return;
        }

        // clear interval for deleting room and user after 60 seconds
        clearTimeout(pastUser.interval);
        delete pastUser.interval;

        // reassign new websocket instance
        pastUser.ws = ws;
        ws.userId = pastUser.userId;

        ws.send(
          this.formatMessage(MessageTypes.RECONNECT, {
            board: pastRoom.board,
            yourTurn: userId === pastRoom.playerIdToMove
          })
        );

        break;
      }

      case MessageTypes.MOVE: {
        const coordinates: Coordinates = parsedData.coordinates;
        const type: SquareType = parsedData.type;
        const userId = ws.userId;
        const room = this.boardHelper.getRoomByUserId(userId);

        if (!this.boardHelper.isRoomReady(room)) {
          // probably send some message that player is cheating
          return;
        }

        const clientIds = Object.keys(room.playerMap);

        const newPlayerToMove = _.find(clientIds, (id) => id !== userId);
        room.playerIdToMove = newPlayerToMove;

        this.boardHelper.movePiece({ coordinates, type, userId });

        const coordinatesEnemy = this.boardHelper.getPlayerCoordinates(newPlayerToMove, room.board);
        this.playerMoveCalculator.updatePlayerMoves(coordinatesEnemy, room.board);

        for (const clientId of clientIds) {
          const client = this.stateHandler.getUser(clientId);
          client.ws.send(
            this.formatMessage(MessageTypes.MOVE, { board: room.board, yourTurn: clientId === room.playerIdToMove })
          );
        }

        break;
      }

      default: {
        console.log(`Sorry, the type ${parsedMessage.type} is not handled`);
      }
    }
  }

  handleClose(ws: ExtendedWebSocket) {
    const userId = ws.userId;
    const user = this.stateHandler.getUser(userId);
    if (!userId || !user) {
      return;
    }

    const deletePlayer = () => {
      const roomCode = this.stateHandler.getUser(userId).roomCode;
      delete this.stateHandler.getRoom(roomCode).playerMap[userId];
      this.stateHandler.deleteUser(userId);
    };

    // delete user completely after 60 seconds
    const interval = setTimeout(deletePlayer, 1000 * 60);

    user.interval = interval;
  }

  configureWebSocketServer(wss: WebSocketServer) {
    wss.on('connection', (ws: ExtendedWebSocket) => {
      console.log('Websocket connected');

      ws.on('message', (data) => {
        this.handleMessage(data, ws);
      });

      ws.on('error', (err) => {
        console.log(`WebSocket closed with error: ${err}`);
      });

      ws.on('close', (code, reason) => {
        this.handleClose(ws);
        console.log(`WebSocket closed with code: ${code} and reason: ${reason.toString()}`);
      });
    });
  }
}
