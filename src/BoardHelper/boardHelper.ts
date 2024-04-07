import _ from 'lodash';
import { injectable, inject } from 'inversify';

import { BOARD_WIDTH, MAX_PLAYER_COUNT, Move } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { Board, BoardRow, BoardSquare, Coordinates, Room, RowTypes, SquareType } from '../StateHandler/types';
import { TYPES } from '../../ioc/types';

@injectable()
export class BoardHelper {
  constructor(@inject(TYPES.StateHandler) private stateHandler: StateHandler) {}

  getSquareByCoordinates(coordinates: Coordinates, board: Board): BoardSquare<SquareType> {
    return board[coordinates.y].squares[coordinates.x];
  }

  getPlayerCoordinates(playerId: string, board: Board): Coordinates | null {
    for (const rowKey of Object.keys(board)) {
      const row = board[Number(rowKey)];
      for (const columnKey of Object.keys(row.squares)) {
        const square = row.squares[Number(columnKey)];
        if (square.type === SquareType.Player && square?.playerId === playerId) {
          return { y: Number(rowKey), x: Number(columnKey) };
        }
      }
    }
    return null;
  }

  movePiece({ type, coordinates, userId }: Move) {
    if (type === SquareType.Player) {
      const roomCode = this.stateHandler.getUser(userId).roomCode;
      const room = this.stateHandler.getRoom(roomCode);
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
        affectedSquares.push({ y: coordinates.y + 2, x: coordinates.x, isWalkable: true });
      }
      affectedSquares.push({ y: coordinates.y - 1, x: coordinates.x - 1, isWalkable: true });
    }
    if (rowType === RowTypes.Walls) {
      affectedSquares.push({ y: coordinates.y, x: coordinates.x + 2, isWalkable: false });
      // Check if coordinates are not next to the left border
      if (coordinates.x > 0) {
        affectedSquares.push({ y: coordinates.y, x: coordinates.x - 2, isWalkable: true });
      }
      affectedSquares.push({ y: coordinates.y + 1, x: coordinates.x + 1, isWalkable: true });
    }

    for (const square of affectedSquares) {
      const currentSquare = board[square.y].squares[square.x];
      if (currentSquare.type === SquareType.Wall) {
        board[square.y].squares[square.x] = { ...currentSquare, isAvailable: false, isWalkable: square.isWalkable };
      }
    }
  }

  isRoomReady(room: Room) {
    const bothPlayersJoined = Object.keys(room.playerMap).length === MAX_PLAYER_COUNT;
    const bothPlayersReady = _.every(Object.values(room.playerMap), (player) => player.ready);

    return bothPlayersJoined && bothPlayersReady;
  }

  getRoomByUserId(userId: string) {
    const user = this.stateHandler.getUser(userId);
    const roomCode = user.roomCode;
    return this.stateHandler.getRoom(roomCode);
  }

  createNewBoard(): Board {
    const array = Array.from(Array(BOARD_WIDTH).keys());
    const board = array.reduce((map: Board, index) => {
      map[index] =
        index % 2 === 0 ? this.createRow(RowTypes.Mixed, index === 0) : this.createRow(RowTypes.Walls, false);
      return map;
    }, {});
    return board;
  }

  private createRow(type: RowTypes, isTopRow: boolean): BoardRow<SquareType> {
    const array = Array.from(Array(BOARD_WIDTH).keys());
    const row: BoardRow<SquareType> = {
      type,
      squares:
        type === RowTypes.Mixed
          ? array.map((index) => {
              return index % 2 === 0
                ? { type: SquareType.Player, isAvailable: false }
                : {
                    type: SquareType.Wall,
                    isPlaced: false,
                    isAvailable: !isTopRow,
                    isWalkable: true
                  };
            })
          : array.map((index) => {
              const IS_LAST_COLUMN = index < BOARD_WIDTH - 1;
              return {
                type: SquareType.Wall,
                isPlaced: false,
                isAvailable: index % 2 === 0 && IS_LAST_COLUMN,
                isWalkable: index % 2 === 0
              };
            })
    };
    return row;
  }
}
