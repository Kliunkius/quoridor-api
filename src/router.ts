import express, { Request, Response } from 'express';

import { roomsMap } from './boardHelper';
import { createNewBoard } from './boardHelper';

const router = express.Router();

router.post('/create-room', (req: Request, res: Response) => {
  const roomCode = req.body.roomCode;

  if (!roomCode) {
    res.status(404);
    res.send();
  }

  const newBoard = createNewBoard();
  roomsMap[roomCode] = { board: newBoard, playerMap: {} };

  res.send({ success: true });
});

export default router;
