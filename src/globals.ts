import { Board } from './boardHelper';

type Room = {
  player1Id: number;
  player2Id?: number;
  board: Board;
};

type User = {
  playerId: number;
  roomCode: string;
};

export const roomsMap: Record<string, Room> = {};
export const usersMap: Record<number, User> = {};
