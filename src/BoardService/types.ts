import { Coordinates, SquareType } from '../StateHandler/types';

export type Move = { type: SquareType; coordinates: Coordinates; userId: string };

export const PLAYER1_STARTING_POSITION: Coordinates = { x: 8, y: 16 };
export const PLAYER2_STARTING_POSITION: Coordinates = { x: 8, y: 0 };

export const MAX_PLAYER_COUNT = 2;

// the board is 17x17 because we count walls as seperate squares
// board height is also 17 because the board is square
export const BOARD_WIDTH = 17;
