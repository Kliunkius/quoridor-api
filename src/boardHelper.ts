import _ from 'lodash';
import { WebSocket } from 'ws';
import { getRoomByUserId } from './websocketHelper';

export type Room = {
  playerMap: Record<string, Player>;
  playerIdToMove: string;
  board: Board;
};

export const PLAYER1_STARTING_POSITION: Coordinates = { x: 8, y: 16 };
export const PLAYER2_STARTING_POSITION: Coordinates = { x: 8, y: 0 };

export const MAX_PLAYER_COUNT = 2;

export type Coordinates = {
  // coordinateX
  x: number;
  // coordinateY
  y: number;
};

export type Player = {
  coordinates: Coordinates;
  ready: boolean;
  name: string;
};

type User = {
  ws: WebSocket;
  interval?: NodeJS.Timeout;
  userId: string;
  roomCode: string;
};

export const roomsMap: Record<string, Room> = {};
export const usersMap: Record<string, User> = {};

export enum SquareType {
  Player,
  Wall
}

enum RowTypes {
  Mixed,
  Walls
}

type BoardSquare<T> = T extends SquareType.Player
  ? { type: T; playerId?: string }
  : T extends SquareType.Wall
    ? { type: T; isPlaced: boolean; isAvailable: boolean; isWalkable: boolean }
    : never;

type BoardRow<T> = { type: RowTypes; squares: BoardSquare<T>[] };

export type Board = Record<number, BoardRow<SquareType>>;

// the board is 17x17 because we count walls as seperate squares
// board height is also 17 because the board is square
const BOARD_WIDTH = 17;

const createRow = (type: RowTypes, isTopRow: boolean): BoardRow<SquareType> => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const row: BoardRow<SquareType> = {
    type,
    squares:
      type === RowTypes.Mixed
        ? array.map((index) => {
            return index % 2 === 0
              ? { type: SquareType.Player }
              : {
                  type: SquareType.Wall,
                  isPlaced: false,
                  isAvailable: !isTopRow,
                  isWalkable: true
                };
          })
        : array.map((index) => ({
            type: SquareType.Wall,
            isPlaced: false,
            isAvailable: index % 2 === 0 && index < BOARD_WIDTH - 1,
            isWalkable: index % 2 === 0
          }))
  };
  return row;
};

export const createNewBoard = (): Board => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const board = array.reduce((map: Board, index) => {
    map[index] =
      index % 2 === 0
        ? index === 0
          ? createRow(RowTypes.Mixed, true)
          : createRow(RowTypes.Mixed, false)
        : createRow(RowTypes.Walls, false);
    return map;
  }, {});
  return board;
};

export type Move = { type: SquareType; coordinates: Coordinates; userId: string };

const updateBoardWalls = (rowType: RowTypes, coordinates: Coordinates, board: Board) => {
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
};

export const movePiece = ({ type, coordinates, userId }: Move) => {
  if (type === SquareType.Player) {
    const roomCode = usersMap[userId].roomCode;
    const player = roomsMap[roomCode].playerMap[userId];
    const previousCoordinates = player.coordinates;
    const square = roomsMap[roomCode].board[previousCoordinates.y].squares[previousCoordinates.x];
    if (square.type !== SquareType.Player) {
      return;
    }
    delete square.playerId;

    const newSquare = roomsMap[roomCode].board[coordinates.y].squares[coordinates.x];
    if (newSquare.type !== SquareType.Player) {
      return;
    }
    newSquare.playerId = userId;

    player.coordinates = coordinates;
  }

  if (type === SquareType.Wall) {
    const room = getRoomByUserId(userId);
    const board = room.board;
    const row = board[coordinates.y];
    updateBoardWalls(row.type, coordinates, board);
  }
};
