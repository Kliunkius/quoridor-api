import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { BoardService } from '../BoardService/boardService';
import { PlayerMoveCalculator } from '../PlayerMoveCalculator/playerMoveCalculator';
import { Websocket } from '../Websocket/websocket';

const iocContainer = new Container();
iocContainer.bind<StateHandler>(TYPES.StateHandler).to(StateHandler).inSingletonScope();
iocContainer.bind<BoardService>(TYPES.BoardService).to(BoardService);
iocContainer.bind<PlayerMoveCalculator>(TYPES.PlayerMoveCalculator).to(PlayerMoveCalculator);
iocContainer.bind<Websocket>(TYPES.Websocket).to(Websocket);

export { iocContainer };
