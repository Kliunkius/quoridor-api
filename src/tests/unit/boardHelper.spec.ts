import 'reflect-metadata';
import { mock } from 'jest-mock-extended';

import { BoardService } from '../../BoardService/boardService';
import { StateHandler } from '../../StateHandler/stateHandler';
import { Coordinates, ExtendedWebSocket, SquareType } from '../../StateHandler/types';
import { getMockedRoom } from '../testHelper';
import { getSquareByCoordinates } from '../../BoardService/helper';
import { PLAYER1_STARTING_POSITION } from '../../BoardService/types';

describe('BoardService unit tests', () => {
  let boardService: BoardService;
  const stateHandlerMock = mock<StateHandler>();

  beforeEach(() => {
    boardService = new BoardService(stateHandlerMock);
  });

  describe('#movePiece', () => {
    const USER_ID = 'user-id1';
    const ROOM_CODE = 'room-code1';

    const ROOM = getMockedRoom();
    const BOARD = ROOM.board;

    beforeEach(() => {
      stateHandlerMock.getUser
        .calledWith(USER_ID)
        .mockReturnValue({ ws: mock<ExtendedWebSocket>(), userId: USER_ID, roomCode: ROOM_CODE });

      stateHandlerMock.getRoom.calledWith(ROOM_CODE).mockReturnValue(ROOM);
    });

    it('should move player', async () => {
      const newPlayerPosition: Coordinates = { x: 10, y: 8 };
      boardService.movePiece({ type: SquareType.Player, coordinates: newPlayerPosition, userId: USER_ID });

      const previousPlayerSquare = getSquareByCoordinates<SquareType.Player>(
        PLAYER1_STARTING_POSITION,
        BOARD,
        SquareType.Player
      );
      const currentPlayerSquare = getSquareByCoordinates<SquareType.Player>(
        newPlayerPosition,
        BOARD,
        SquareType.Player
      );

      expect(previousPlayerSquare.playerId).toBe(undefined);
      expect(currentPlayerSquare.playerId).toBe(USER_ID);
    });
  });
});
