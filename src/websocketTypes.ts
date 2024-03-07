export enum MessageTypes {
  JOIN_ROOM = 1,
  RECONNECT,
  MOVE
}

export type Message = {
  type: MessageTypes;
  data: any;
};
