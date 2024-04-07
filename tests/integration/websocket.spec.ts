import 'reflect-metadata';
import { WebSocket, WebSocketServer } from 'ws';
import { mock } from 'jest-mock-extended';

import { Websocket } from '../../src/Websocket/websocket';
import { BoardHelper } from '../../src/BoardHelper/boardHelper';
import { PlayerMoveCalculator } from '../../src/PlayerMoveCalculator/playerMoveCalculator';
import { StateHandler } from '../../src/StateHandler/stateHandler';
import { Message, MessageTypes } from '../../src/Websocket/types';

describe('WebSocket Server Integration Tests', () => {
  let websocket: Websocket;
  let server: WebSocketServer;
  const stateHandlerMock = mock<StateHandler>();
  const boardHelperMock = mock<BoardHelper>();
  const playerMoveCalculatorMock = mock<PlayerMoveCalculator>();

  beforeEach(() => {
    websocket = new Websocket(boardHelperMock, stateHandlerMock, playerMoveCalculatorMock);
    server = new WebSocketServer({ port: 8080 });
    websocket.configureWebSocketServer(server);
  });

  afterEach(() => {
    server.close();
  });

  it('should echo back messages', async () => {
    const wsPromise = (): Promise<WebSocket> => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.on('open', () => {
          resolve(ws);
        });
      });
    };

    const ws = await wsPromise();

    let called = 2;

    const messagePromise = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        ws.on('message', (data: any) => {
          const parsedMessage: Message = JSON.parse(data);

          switch (parsedMessage.type) {
            case MessageTypes.ROOM_DELETED: {
              called = 5;
              resolve();
            }
          }
        });
      });
    };

    ws.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, {}));

    await messagePromise();

    ws.close();

    expect(called).toBe(5);
  });

  it('should echo back messages 2', async () => {
    const wsPromise = (): Promise<WebSocket> => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.on('open', () => {
          resolve(ws);
        });
      });
    };

    const ws = await wsPromise();

    let called = 3;

    const messagePromise = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        ws.on('message', (data: any) => {
          const parsedMessage: Message = JSON.parse(data);

          switch (parsedMessage.type) {
            case MessageTypes.ROOM_DELETED: {
              called = 4;
              resolve();
            }
          }
        });
      });
    };

    ws.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, {}));

    await messagePromise();

    ws.close();

    expect(called).toBe(4);
  });
});
