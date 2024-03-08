import _ from 'lodash';

import { MAX_PLAYER_COUNT, Room, roomsMap, usersMap } from './boardHelper';

export const isRoomReady = (room: Room) => {
  const bothPlayersJoined = Object.keys(room.playerMap).length === MAX_PLAYER_COUNT;
  const bothPlayersReady = _.every(Object.values(room.playerMap), (player) => player.ready);

  return bothPlayersJoined && bothPlayersReady;
};

export const getRoomByUserId = (userId: string) => {
  const user = usersMap[userId];
  const roomCode = user.roomCode;
  return roomsMap[roomCode];
};
