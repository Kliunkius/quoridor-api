import { WebSocketServer } from 'ws';

export const configureWebSocketServer = (wss: WebSocketServer) => {
  wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
      console.log('guga', data.toString());
      ws.send('I gots your message cuh');
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
