import { WebSocket } from 'ws';
import { Message, MessageTypes } from '../../Websocket/types';
import { Websocket } from '../../Websocket/websocket';
import { ExtendedWebSocket } from '../../StateHandler/types';

export type TestExtendedWebSocket = ExtendedWebSocket & {
  yourTurn?: boolean;
};

export const addConnection = async (url: string) => {
  const connectionPromise = (): Promise<TestExtendedWebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.on('open', () => {
        resolve(ws as TestExtendedWebSocket);
      });
    });
  };

  return await connectionPromise();
};

export const addPlayerToRoom = async (url: string, roomCode: string, websocket: Websocket) => {
  const ws = await addConnection(url);

  const messagePromise = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      ws.on('message', (data: any) => {
        const parsedMessage: Message = JSON.parse(data);

        switch (parsedMessage.type) {
          case MessageTypes.JOIN_ROOM: {
            ws.userId = parsedMessage.data.userId;
            resolve();
          }
        }
      });
    });
  };

  ws.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, { roomCode }));
  await messagePromise();

  return ws;
};

export const readyPlayer = async (ws: TestExtendedWebSocket, websocket: Websocket) => {
  const messagePromise = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      ws.on('message', (data: any) => {
        const parsedMessage: Message = JSON.parse(data);

        switch (parsedMessage.type) {
          case MessageTypes.READY: {
            ws.yourTurn = parsedMessage.data.yourTurn;
            resolve();
          }
        }
      });
    });
  };

  ws.send(websocket.formatMessage(MessageTypes.READY, {}));
  await messagePromise();
};

export const xor = (A: boolean, B: boolean) => A != B && (A || B);
