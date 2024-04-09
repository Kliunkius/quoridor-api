import _ from 'lodash';
import { injectable, inject } from 'inversify';

import { BOARD_WIDTH, Move } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { Board, BoardSquare, Coordinates, RowTypes, SquareType } from '../StateHandler/types';
import { TYPES } from '../ioc/types';
import { getSquareByCoordinates } from './helper';

@injectable()
export class BoardService {
  constructor(@inject(TYPES.StateHandler) private stateHandler: StateHandler) {}

  movePiece({ type, coordinates, userId }: Move) {
    if (type === SquareType.Player) {
      const room = this.getRoomByUserId(userId);
      const player = room.playerMap[userId];
      const previousCoordinates = player.coordinates;
      const square = getSquareByCoordinates<SquareType.Player>(previousCoordinates, room.board, SquareType.Player);
      delete square.playerId;

      const newSquare = getSquareByCoordinates<SquareType.Player>(coordinates, room.board, SquareType.Player);
      newSquare.playerId = userId;

      player.coordinates = coordinates;
    }

    if (type === SquareType.Wall) {
      const room = this.getRoomByUserId(userId);
      const board = room.board;
      const row = board[coordinates.y];
      this.updateBoardWalls(row.type, coordinates, board);
    }
  }

  updateBoardWalls(rowType: RowTypes, coordinates: Coordinates, board: Board) {
    const blockedSquares: BoardSquare<SquareType.Wall>[] = [];
    const unavailableSquares: BoardSquare<SquareType.Wall>[] = [];

    const targetedSquare = getSquareByCoordinates<SquareType.Wall>(
      { y: coordinates.y, x: coordinates.x },
      board,
      SquareType.Wall
    );

    targetedSquare.isAvailable = false;
    targetedSquare.isWalkable = false;
    targetedSquare.isPlaced = true;

    if (rowType === RowTypes.Mixed) {
      const wallAbove = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y - 2, x: coordinates.x },
        board,
        SquareType.Wall
      );
      blockedSquares.push(wallAbove);

      // Check if coordinates are not next to the top border
      if (coordinates.y < BOARD_WIDTH - 1) {
        const squareUnder = getSquareByCoordinates<SquareType.Wall>(
          { y: coordinates.y + 2, x: coordinates.x },
          board,
          SquareType.Wall
        );
        unavailableSquares.push(squareUnder);
      }

      const squareTopLeft = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y - 1, x: coordinates.x - 1 },
        board,
        SquareType.Wall
      );
      unavailableSquares.push(squareTopLeft);
    }

    if (rowType === RowTypes.Walls) {
      const wallToTheRight = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y, x: coordinates.x + 2 },
        board,
        SquareType.Wall
      );
      blockedSquares.push(wallToTheRight);

      // Check if coordinates are not next to the left border
      if (coordinates.x > 0) {
        const squareToTheLeft = getSquareByCoordinates<SquareType.Wall>(
          { y: coordinates.y, x: coordinates.x - 2 },
          board,
          SquareType.Wall
        );
        unavailableSquares.push(squareToTheLeft);
      }

      const squareBottomRight = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y + 1, x: coordinates.x + 1 },
        board,
        SquareType.Wall
      );
      unavailableSquares.push(squareBottomRight);
    }

    for (const square of blockedSquares) {
      square.isWalkable = false;
      square.isAvailable = false;
    }

    for (const square of unavailableSquares) {
      square.isAvailable = false;
    }
  }

  getRoomByUserId(userId: string) {
    const user = this.stateHandler.getUser(userId);
    const roomCode = user.roomCode;
    return this.stateHandler.getRoom(roomCode);
  }
}
