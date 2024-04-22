import 'reflect-metadata';
import { WebSocket, WebSocketServer } from 'ws';

import { Websocket } from '../../Websocket/websocket';
import { Message, MessageTypes } from '../../Websocket/types';
import { createIocContainer } from '../../ioc/inversify.config';
import { TYPES } from '../../ioc/types';
import { StateHandler } from '../../StateHandler/stateHandler';
import { createNewBoard } from '../../BoardService/helper';
import { addConnection, addPlayerToRoom } from './helper';

const SERVER_PORT = 8080;
const SERVER_URL = `ws://localhost:${SERVER_PORT}`;

describe('WebSocket Server Integration Tests', () => {
  const testContainer = createIocContainer();
  const websocket = testContainer.get<Websocket>(TYPES.Websocket);
  const stateHandler = testContainer.get<StateHandler>(TYPES.StateHandler);
  let server: WebSocketServer;

  beforeEach(() => {
    server = new WebSocketServer({ port: 8080 });
    websocket.configureWebSocketServer(server);
  });

  afterEach(() => {
    server.close();
    stateHandler.clearState();
  });

  describe('#handleMessage', () => {
    describe('JOIN_ROOM', () => {
      it('should notify user if room does not exist', async () => {
        const wsPromise = (): Promise<WebSocket> => {
          return new Promise((resolve, reject) => {
            const ws = new WebSocket(SERVER_URL);

            ws.on('open', () => {
              resolve(ws);
            });
          });
        };

        const ws = await wsPromise();

        let receivedMessage = false;

        const messagePromise = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            ws.on('message', (data: any) => {
              const parsedMessage: Message = JSON.parse(data);

              switch (parsedMessage.type) {
                case MessageTypes.ROOM_DELETED: {
                  receivedMessage = true;
                  resolve();
                }
              }
            });
          });
        };

        ws.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, {}));

        await messagePromise();

        ws.close();

        expect(receivedMessage).toBe(true);
      });

      it('should notify user if room does not exist', async () => {
        const roomCode = 'abc';

        const newBoard = createNewBoard();
        stateHandler.setRoom(roomCode, { board: newBoard, playerMap: {}, playerIdToMove: '' });

        const otherPlayerWs = await addPlayerToRoom(SERVER_URL, roomCode, websocket);

        const playerWs = await addConnection(SERVER_URL);

        let receivedMessage = false;

        const messagePromise = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            playerWs.on('message', (data: any) => {
              const parsedMessage: Message = JSON.parse(data);

              switch (parsedMessage.type) {
                case MessageTypes.JOIN_ROOM: {
                  receivedMessage = true;
                  playerWs.userId = parsedMessage.data.userId;
                  resolve(parsedMessage.data);
                }
              }
            });
          });
        };

        playerWs.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, { roomCode }));

        const data = await messagePromise();

        const expectedData = {
          userId: playerWs.userId,
          yourName: playerWs.userId,
          board: stateHandler.getRoom(roomCode).board,
          otherPlayer: {
            ready: false,
            name: otherPlayerWs.userId
          }
        };

        playerWs.close();
        otherPlayerWs.close();

        expect(receivedMessage).toBe(true);
        expect(data).toEqual(expectedData);
      });
    });
  });
});
