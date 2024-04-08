import { createNewBoard, getSquareByCoordinates } from '../BoardService/helper';
import { PLAYER1_STARTING_POSITION, PLAYER2_STARTING_POSITION } from '../BoardService/types';
import { Board, Player, Room, SquareType } from '../StateHandler/types';

export const USER_ID1 = 'user-id1';
export const USER_ID2 = 'user-id2';

export const getMockedRoom = (): Room => {
  const playerMap: Record<string, Player> = {
    [USER_ID1]: {
      coordinates: PLAYER1_STARTING_POSITION,
      ready: true,
      name: 'player1'
    },
    [USER_ID2]: {
      coordinates: PLAYER2_STARTING_POSITION,
      ready: true,
      name: 'player1'
    }
  };
  const board: Board = createNewBoard();
  const player1Square = getSquareByCoordinates<SquareType.Player>(PLAYER1_STARTING_POSITION, board, SquareType.Player);
  player1Square.playerId = USER_ID1;
  const player2Square = getSquareByCoordinates<SquareType.Player>(PLAYER2_STARTING_POSITION, board, SquareType.Player);
  player2Square.playerId = USER_ID2;

  return {
    playerMap,
    playerIdToMove: USER_ID1,
    board
  };
};
