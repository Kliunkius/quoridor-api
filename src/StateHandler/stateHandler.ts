import { injectable } from 'inversify';
import { Room, RoomsMap, User, UsersMap } from './types';

@injectable()
export class StateHandler {
  private roomsMap: RoomsMap;
  private usersMap: UsersMap;

  constructor() {
    this.roomsMap = {};
    this.usersMap = {};
  }

  getRoom(roomCode: string) {
    return this.roomsMap[roomCode];
  }

  setRoom(roomCode: string, room: Room) {
    this.roomsMap[roomCode] = room;
  }

  getUser(userId: string) {
    return this.usersMap[userId];
  }

  setUser(userId: string, user: User) {
    this.usersMap[userId] = user;
  }

  deleteUser(userId: string) {
    delete this.usersMap[userId];
  }

  clearState() {
    this.roomsMap = {};
    this.usersMap = {};
  }
}
