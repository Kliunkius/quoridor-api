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
  ? { type: T; playerId?: string; isAvailable: boolean }
  : T extends SquareType.Wall
    ? { type: T; isPlaced: boolean; isAvailable: boolean; isWalkable: boolean }
    : never;

type BoardRow<T> = { type: RowTypes; squares: BoardSquare<T>[] };

export type Board = Record<number, BoardRow<SquareType>>;

const getSquareByCoordinates = (coordinates: Coordinates, board: Board): BoardSquare<SquareType> => {
  return board[coordinates.y].squares[coordinates.x];
};

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

export const createNewBoard = (): Board => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const board = array.reduce((map: Board, index) => {
    map[index] = index % 2 === 0 ? createRow(RowTypes.Mixed, index === 0) : createRow(RowTypes.Walls, false);
    return map;
  }, {});
  return board;
};

export type Move = { type: SquareType; coordinates: Coordinates; userId: string };

const resetMoves = (board: Board) => {
  const keys = Object.keys(board);
  keys.map((rowKey) => {
    const row = board[Number(rowKey)];
    row.squares.map((square) => {
      if (square.type === SquareType.Player) {
        square.isAvailable = false;
      }
    });
  });
};

const checkLinear = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
  const square = getSquareByCoordinates(coordinatesSquare, board);
  if (square.type !== SquareType.Player) throw new Error('Bad calculation.');
  if (square.playerId) return false;
  const coordinatesWallInBetween: Coordinates = {
    y: coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2,
    x: coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2
  };
  const wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error('Bad calculation.');
  if (!wallInBetween.isWalkable) return false;
  return true;
};

const checkDiagonalFromOneSide = (
  coordinatesSquare: Coordinates,
  coordinatesPlayer: Coordinates,
  board: Board,
  startFromHorizontal: boolean
): boolean => {
  const square = getSquareByCoordinates(coordinatesSquare, board);
  if (square.type !== SquareType.Player) throw new Error('Bad calculation.');
  // When targeted square is occupied by player
  if (square.playerId) return false;

  // When wall to the side of player's origin square is not walkable
  let coordinatesWallInBetween: Coordinates = {
    y: startFromHorizontal
      ? coordinatesPlayer.y
      : coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2,
    x: startFromHorizontal ? coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2 : coordinatesPlayer.x
  };
  let wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error('Bad calculation.');
  if (!wallInBetween.isWalkable) return false;

  // When player square to the side of player's origin is not other player
  const coordinatesPlayerInBetween: Coordinates = {
    y: startFromHorizontal ? coordinatesPlayer.y : coordinatesSquare.y,
    x: startFromHorizontal ? coordinatesSquare.x : coordinatesPlayer.x
  };
  const playerInBetween = getSquareByCoordinates(coordinatesPlayerInBetween, board);
  if (playerInBetween.type !== SquareType.Player) throw new Error('Bad calculation.');
  if (!playerInBetween.playerId) return false;

  // When wall above or below the targeted square is not walkable
  coordinatesWallInBetween = {
    y: startFromHorizontal
      ? coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2
      : coordinatesSquare.y,
    x: startFromHorizontal ? coordinatesSquare.x : coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2
  };
  wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error('Bad calculation.');
  if (!wallInBetween.isWalkable) return false;

  // When targeted square is not near the border of the board or there is no wall that would block linear jump
  if (
    startFromHorizontal
      ? coordinatesSquare.x
      : coordinatesSquare.y !== 0 && startFromHorizontal
        ? coordinatesSquare.x
        : coordinatesSquare.y !== BOARD_WIDTH - 1
  ) {
    coordinatesWallInBetween = {
      y: startFromHorizontal
        ? coordinatesPlayer.y
        : coordinatesPlayer.y + ((coordinatesSquare.y - coordinatesPlayer.y) / 2) * 3,
      x: startFromHorizontal
        ? coordinatesPlayer.x + ((coordinatesSquare.x - coordinatesPlayer.x) / 2) * 3
        : coordinatesPlayer.x
    };
    wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
    if (wallInBetween.type !== SquareType.Wall) throw new Error('Bad calculation.');
    if (wallInBetween.isWalkable) return false;
  }

  return true;
};

const checkDiagonal = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
  if (
    checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, true) ||
    checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, false)
  ) {
    return true;
  }
  return false;
};

const updatePlayerMoves = (coordinatesPlayer: Coordinates, board: Board) => {
  resetMoves(board);
};

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
