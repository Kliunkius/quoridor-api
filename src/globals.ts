import { Board } from './boardHelper';

type Room = {
  player1Id?: string;
  player2Id?: string;
  board: Board;
};

export enum UserRole {
  PLAYER1,
  PLAYER2
}

type User = {
  playerId: string;
  roomCode: string;
  role: UserRole;
};

export const roomsMap: Record<string, Room> = {};
export const usersMap: Record<string, User> = {};
