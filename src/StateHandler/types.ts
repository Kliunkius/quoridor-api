import { WebSocket } from 'ws';

export type RoomsMap = Record<string, Room>;

export type Room = {
  playerMap: Record<string, Player>;
  playerIdToMove: string;
  board: Board;
};

export type Player = {
  coordinates: Coordinates;
  ready: boolean;
  name: string;
};

export type Coordinates = {
  // coordinateX
  x: number;
  // coordinateY
  y: number;
};

export type Board = Record<number, BoardRow<SquareType>>;

export type BoardRow<T> = { type: RowTypes; squares: BoardSquare<T>[] };

export enum RowTypes {
  Mixed,
  Walls
}

export type BoardSquare<T> = T extends SquareType.Player
  ? { type: T; playerId?: string; isAvailable: boolean }
  : T extends SquareType.Wall
    ? { type: T; isPlaced: boolean; isAvailable: boolean; isWalkable: boolean }
    : never;

export enum SquareType {
  Player,
  Wall
}

export type UsersMap = Record<string, User>;

export type ExtendedWebSocket = WebSocket & {
  userId: string;
};

export type User = {
  ws: ExtendedWebSocket;
  interval?: NodeJS.Timeout;
  userId: string;
  roomCode: string;
};
