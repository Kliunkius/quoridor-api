import express, { Request, Response } from 'express';

import { roomsMap } from './globals';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Gyat damn!');
});

router.get('/rooms', (req: Request, res: Response) => {
  res.send(roomsMap);
});

export default router;
