import { WebSocket } from 'ws';

type Room = {
  playerMap: Record<string, Player>;
  board: Board;
};

export enum UserRole {
  PLAYER1,
  PLAYER2
}

export const PLAYER1_STARTING_POSITION: Coordinates = { x: 8, y: 16 };
export const PLAYER2_STARTING_POSITION: Coordinates = { x: 8, y: 0 };

export type Coordinates = {
  // coordinateX
  x: number;
  // coordinateY
  y: number;
};

export type Player = {
  role: UserRole;
  coordinates: Coordinates;
};

type User = {
  playerId: string;
  roomCode: string;
  role: UserRole;
};

type Client = {
  ws: WebSocket;
  interval?: NodeJS.Timeout;
};

export const roomsMap: Record<string, Room> = {};
export const usersMap: Record<string, User> = {};
export const clientsMap: Record<string, Client> = {};

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
    ? { type: T; isPlaced: boolean }
    : never;

type BoardRow<T> = { type: RowTypes; squares: BoardSquare<T>[] };

export type Board = Record<number, BoardRow<SquareType>>;

// the board is 17x17 because we count walls as seperate squares
// board height is also 17 because the board is square
const BOARD_WIDTH = 17;

const createRow = (type: RowTypes): BoardRow<SquareType> => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const row: BoardRow<SquareType> = {
    type,
    squares:
      type === RowTypes.Mixed
        ? array.map((index) => {
            return index % 2 ? { type: SquareType.Player } : { type: SquareType.Wall, isPlaced: false };
          })
        : array.map(() => ({ type: SquareType.Wall, isPlaced: false }))
  };
  return row;
};

export const createNewBoard = (): Board => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const board = array.reduce((map: Board, index) => {
    map[index] = index % 2 ? createRow(RowTypes.Mixed) : createRow(RowTypes.Walls);
    return map;
  }, {});
  return board;
};

export type Move = { type: SquareType; coordinates: Coordinates; userId: string };

export const movePiece = ({ type, coordinates, userId }: Move) => {
  if (type === SquareType.Player) {
    const roomCode = usersMap[userId].roomCode;
    const previousCoordinates = roomsMap[roomCode].playerMap[userId].coordinates;
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
  }

  if (type === SquareType.Wall) {
    const roomCode = usersMap[userId].roomCode;
    const board = roomsMap[roomCode].board;
    const row = board[coordinates.y];
    if (row.type === RowTypes.Walls) {
      for (let i = coordinates.x; i <= coordinates.x + 2; i++) {
        const square = row.squares[i];
        if (square.type === SquareType.Wall) {
          square.isPlaced = true;
        }
      }
    }
    if (row.type === RowTypes.Mixed) {
      for (let i = coordinates.y; i >= coordinates.y - 2; i--) {
        const square = board[i].squares[coordinates.x];
        if (square.type === SquareType.Wall) {
          square.isPlaced = true;
        }
      }
    }
  }
};
