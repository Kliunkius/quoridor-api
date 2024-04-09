import _ from 'lodash';
import { Board, BoardRow, BoardSquare, Coordinates, Room, RowTypes, SquareType } from '../StateHandler/types';
import { BOARD_WIDTH, MAX_PLAYER_COUNT } from './types';

export const createNewBoard = (): Board => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const board = array.reduce((map: Board, index) => {
    map[index] = index % 2 === 0 ? createRow(RowTypes.Mixed, index === 0) : createRow(RowTypes.Walls, false);
    return map;
  }, {});
  return board;
};

const createRow = (type: RowTypes, isTopRow: boolean): BoardRow<SquareType> => {
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
};

export const getSquareByCoordinates = <T = SquareType.Player>(
  coordinates: Coordinates,
  board: Board,
  expectedType: SquareType
): BoardSquare<T> => {
  const square = board[coordinates.y]?.squares[coordinates.x] || ({} as BoardSquare<T>);

  if (square.type !== expectedType) {
    console.error('Bad square type calculation.');
    return null;
  }

  return board[coordinates.y].squares[coordinates.x] as BoardSquare<T>;
};

export const isRoomReady = (room: Room): boolean => {
  const bothPlayersJoined = Object.keys(room.playerMap).length === MAX_PLAYER_COUNT;
  const bothPlayersReady = _.every(Object.values(room.playerMap), (player) => player.ready);

  return bothPlayersJoined && bothPlayersReady;
};

export const getPlayerCoordinates = (playerId: string, board: Board): Coordinates | null => {
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
};
