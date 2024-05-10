export enum MessageTypes {
  JOIN_ROOM = 1,
  RECONNECT,
  MOVE,
  ROOM_DELETED,
  READY,
  FINISH
}

export type Message = {
  type: MessageTypes;
  data: any;
};
