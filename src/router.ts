import express, { Request, Response } from 'express';

import { rooms } from './globals';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Gyat damn!');
});

router.get('/rooms', (req: Request, res: Response) => {
  res.send(rooms);
});

router.post('/create-room', (req: Request, res: Response) => {
  rooms[req.body.roomCode] = 'jerma';
  res.send({ success: true });
});

export default router;
