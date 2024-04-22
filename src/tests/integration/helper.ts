import { WebSocket } from 'ws';
import { Message, MessageTypes } from '../../Websocket/types';
import { Websocket } from '../../Websocket/websocket';
import { ExtendedWebSocket } from '../../StateHandler/types';

export const addConnection = async (url: string) => {
  const otherPlayerWsPromise = (): Promise<ExtendedWebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      ws.on('open', () => {
        resolve(ws as ExtendedWebSocket);
      });
    });
  };

  return await otherPlayerWsPromise();
};

export const addPlayerToRoom = async (url: string, roomCode: string, websocket: Websocket) => {
  const otherPlayerWs = await addConnection(url);

  const otherPlayerMessagePromise = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      otherPlayerWs.on('message', (data: any) => {
        const parsedMessage: Message = JSON.parse(data);

        switch (parsedMessage.type) {
          case MessageTypes.JOIN_ROOM: {
            otherPlayerWs.userId = parsedMessage.data.userId;
            resolve();
          }
        }
      });
    });
  };

  otherPlayerWs.send(websocket.formatMessage(MessageTypes.JOIN_ROOM, { roomCode }));
  await otherPlayerMessagePromise();

  return otherPlayerWs;
};
