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

    it('should move player', () => {
      const newPlayerPosition: Coordinates = { y: 8, x: 10 };
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

    it('should throw error when moving player to a wall square', () => {
      const wallSquare: Coordinates = { y: 8, x: 11 };

      expect(() =>
        boardService.movePiece({ type: SquareType.Player, coordinates: wallSquare, userId: USER_ID })
      ).toThrow();
    });

    it('should place wall in a wall row', () => {
      const horizontalWallPosition: Coordinates = { y: 5, x: 4 };
      boardService.movePiece({ type: SquareType.Wall, coordinates: horizontalWallPosition, userId: USER_ID });

      const targetedSquare = getSquareByCoordinates<SquareType.Wall>(horizontalWallPosition, BOARD, SquareType.Wall);
      expect(targetedSquare.isAvailable).toBe(false);
      expect(targetedSquare.isWalkable).toBe(false);
      expect(targetedSquare.isPlaced).toBe(true);

      const blockedSquaresCoordinates: Coordinates[] = [
        { y: horizontalWallPosition.y, x: horizontalWallPosition.x + 2 }
      ];
      const unavailableSquaresCoordinates: Coordinates[] = [
        { y: horizontalWallPosition.y, x: horizontalWallPosition.x - 2 },
        { y: horizontalWallPosition.y + 1, x: horizontalWallPosition.x + 1 }
      ];

      for (const squareCoordinates of blockedSquaresCoordinates) {
        const square = getSquareByCoordinates<SquareType.Wall>(squareCoordinates, BOARD, SquareType.Wall);
        expect(square.isAvailable).toBe(false);
        expect(square.isWalkable).toBe(false);
        expect(square.isPlaced).toBe(false);
      }

      for (const squareCoordinates of unavailableSquaresCoordinates) {
        const square = getSquareByCoordinates<SquareType.Wall>(squareCoordinates, BOARD, SquareType.Wall);
        expect(square.isAvailable).toBe(false);
        expect(square.isWalkable).toBe(true);
        expect(square.isPlaced).toBe(false);
      }
    });

    it('should throw error when moving to a non-existant square', () => {
      const wallSquare: Coordinates = { x: 999, y: 999 };

      expect(() =>
        boardService.movePiece({ type: SquareType.Player, coordinates: wallSquare, userId: USER_ID })
      ).toThrow();
    });
  });
});
