import { WebSocket } from 'ws';

import { Board } from './boardHelper';

type Room = {
  playerMap: Record<string, UserRole>;
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

type Client = {
  ws: WebSocket;
  interval?: NodeJS.Timeout;
};

export const roomsMap: Record<string, Room> = {};
export const usersMap: Record<string, User> = {};
export const clientsMap: Record<string, Client> = {};
