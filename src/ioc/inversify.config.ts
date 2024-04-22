import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { BoardService } from '../BoardService/boardService';
import { PlayerMoveCalculator } from '../PlayerMoveCalculator/playerMoveCalculator';
import { Websocket } from '../Websocket/websocket';

const createIocContainer = () => {
  const container = new Container();
  container.bind<StateHandler>(TYPES.StateHandler).to(StateHandler).inSingletonScope();
  container.bind<BoardService>(TYPES.BoardService).to(BoardService);
  container.bind<PlayerMoveCalculator>(TYPES.PlayerMoveCalculator).to(PlayerMoveCalculator);
  container.bind<Websocket>(TYPES.Websocket).to(Websocket);

  return container;
};

const iocContainer = createIocContainer();

export { iocContainer, createIocContainer };
