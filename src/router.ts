import express, { Request, Response } from 'express';

import { iocContainer } from '../ioc/inversify.config';
import { TYPES } from '../ioc/types';
import { BoardHelper } from './BoardHelper/boardHelper';
import { StateHandler } from './StateHandler/stateHandler';

const router = express.Router();

const stateHandler = iocContainer.get<StateHandler>(TYPES.StateHandler);
const boardHelper = iocContainer.get<BoardHelper>(TYPES.BoardHelper);

router.post('/create-room', (req: Request, res: Response) => {
  const roomCode = req.body.roomCode;

  if (!roomCode) {
    res.status(404);
    res.send();
  }

  const newBoard = boardHelper.createNewBoard();
  stateHandler.setRoom(roomCode, { board: newBoard, playerMap: {}, playerIdToMove: '' });

  res.send({ success: true });
});

export default router;
