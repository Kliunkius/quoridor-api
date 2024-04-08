import _ from 'lodash';
import { injectable, inject } from 'inversify';

import { BOARD_WIDTH, Move } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { Board, Coordinates, RowTypes, SquareType } from '../StateHandler/types';
import { TYPES } from '../ioc/types';

@injectable()
export class BoardService {
  constructor(@inject(TYPES.StateHandler) private stateHandler: StateHandler) {}

  movePiece({ type, coordinates, userId }: Move) {
    if (type === SquareType.Player) {
      const room = this.getRoomByUserId(userId);
      const player = room.playerMap[userId];
      const previousCoordinates = player.coordinates;
      const square = room.board[previousCoordinates.y].squares[previousCoordinates.x];
      if (square.type !== SquareType.Player) {
        return;
      }
      delete square.playerId;

      const newSquare = room.board[coordinates.y].squares[coordinates.x];
      if (newSquare.type !== SquareType.Player) {
        return;
      }
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
    const targetedSquare = board[coordinates.y].squares[coordinates.x];
    if (targetedSquare.type === SquareType.Wall) {
      board[coordinates.y].squares[coordinates.x] = {
        ...targetedSquare,
        isPlaced: true,
        isWalkable: false,
        isAvailable: false
      };
    }

    const affectedSquares: (Coordinates & { isWalkable: boolean })[] = [];
    if (rowType === RowTypes.Mixed) {
      affectedSquares.push({ y: coordinates.y - 2, x: coordinates.x, isWalkable: false });
      // Check if coordinates are not next to the top border
      if (coordinates.y < BOARD_WIDTH - 1) {
        const squareUnder = board[coordinates.y + 2].squares[coordinates.x];
        if (squareUnder.type === SquareType.Wall) {
          affectedSquares.push({ ...squareUnder, y: coordinates.y + 2, x: coordinates.x });
        }
      }
      const squareToTheLeft = board[coordinates.y - 1].squares[coordinates.x - 1];
      if (squareToTheLeft.type === SquareType.Wall) {
        affectedSquares.push({ ...squareToTheLeft, y: coordinates.y - 1, x: coordinates.x - 1 });
      }
    }
    if (rowType === RowTypes.Walls) {
      affectedSquares.push({ y: coordinates.y, x: coordinates.x + 2, isWalkable: false });
      // Check if coordinates are not next to the left border
      if (coordinates.x > 0) {
        const squareToTheLeft = board[coordinates.y].squares[coordinates.x - 2];
        if (squareToTheLeft.type === SquareType.Wall) {
          affectedSquares.push({ ...squareToTheLeft, y: coordinates.y, x: coordinates.x - 2 });
        }
      }
      const squareUnder = board[coordinates.y + 1].squares[coordinates.x + 1];
      if (squareUnder.type === SquareType.Wall) {
        affectedSquares.push({ ...squareUnder, y: coordinates.y + 1, x: coordinates.x + 1 });
      }
    }

    for (const square of affectedSquares) {
      const currentSquare = board[square.y].squares[square.x];
      if (currentSquare.type === SquareType.Wall) {
        board[square.y].squares[square.x] = { ...currentSquare, isAvailable: false, isWalkable: square.isWalkable };
      }
    }
  }

  getRoomByUserId(userId: string) {
    const user = this.stateHandler.getUser(userId);
    const roomCode = user.roomCode;
    return this.stateHandler.getRoom(roomCode);
  }
}
