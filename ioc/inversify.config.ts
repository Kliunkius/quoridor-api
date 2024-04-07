import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { StateHandler } from '../src/StateHandler/stateHandler';
import { BoardHelper } from '../src/BoardHelper/boardHelper';
import { PlayerMoveCalculator } from '../src/PlayerMoveCalculator/playerMoveCalculator';
import { Websocket } from '../src/Websocket/websocket';

const iocContainer = new Container();
iocContainer.bind<StateHandler>(TYPES.StateHandler).to(StateHandler).inSingletonScope();
iocContainer.bind<BoardHelper>(TYPES.BoardHelper).to(BoardHelper);
iocContainer.bind<PlayerMoveCalculator>(TYPES.PlayerMoveCalculator).to(PlayerMoveCalculator);
iocContainer.bind<Websocket>(TYPES.Websocket).to(Websocket);

export { iocContainer };
