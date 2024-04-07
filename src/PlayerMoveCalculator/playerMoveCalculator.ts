import { injectable, inject } from 'inversify';
import { Board, Coordinates, SquareType } from '../StateHandler/types';
import { TYPES } from '../../ioc/types';
import { BoardHelper } from '../BoardHelper/boardHelper';
import { LAST_ROW_INDEX } from './types';

@injectable()
export class PlayerMoveCalculator {
  constructor(@inject(TYPES.BoardHelper) private boardHelper: BoardHelper) {}

  resetMoves(board: Board) {
    const keys = Object.keys(board);
    keys.map((rowKey) => {
      const row = board[Number(rowKey)];
      row.squares.map((square) => {
        if (square.type === SquareType.Player) {
          square.isAvailable = false;
        }
      });
    });
  }

  coordinateOffsetSquare(coordinateSquare: number, coordinatePlayer: number, offset: number): number {
    const difference = coordinateSquare - coordinatePlayer;
    if (difference === 0) return coordinatePlayer;
    return coordinatePlayer + (difference / Math.abs(difference)) * offset;
  }

  // Checks if a player can walk to squares to his left, right, top, bottom (depends on which this is called).
  checkLinear(coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean {
    const square = this.boardHelper.getSquareByCoordinates(coordinatesSquare, board);
    if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");

    // When square is already occupied by other player
    if (square.playerId) return false;

    // When there is a wall between player and targeted square (1st square from player square)
    const coordinatesWallNearPlayer: Coordinates = {
      y: this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 1),
      x: this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 1)
    };
    const wallNearPlayer = this.boardHelper.getSquareByCoordinates(coordinatesWallNearPlayer, board);
    if (wallNearPlayer.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (!wallNearPlayer.isWalkable) return false;
    return true;
  }

  // Checks if a player can jump over to a square 2 blocks away in each direction (depends on which this is called).
  // In order to be able to, there have to be no blocking walls and there has to other player between targeted and current position squares.
  checkLinearJump(coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean {
    const square = this.boardHelper.getSquareByCoordinates(coordinatesSquare, board);
    if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");

    // When there is a wall between player and targeted square (1st square from player square)
    const coordinatesWallNearPlayer: Coordinates = {
      y: this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 1),
      x: this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 1)
    };
    const wallNearPlayer = this.boardHelper.getSquareByCoordinates(coordinatesWallNearPlayer, board);
    if (wallNearPlayer.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (!wallNearPlayer.isWalkable) return false;

    // When there is no enemy between player and targeted square (2nd square from player square)
    const coordinatesEnemy: Coordinates = {
      y: this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 2),
      x: this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 2)
    };
    const enemy = this.boardHelper.getSquareByCoordinates(coordinatesEnemy, board);
    if (enemy.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
    if (!enemy.playerId) return false;

    // When there is a wall between player and targeted square (3rd square from player square)
    const coordinatesWallOverTheEnemy: Coordinates = {
      y: this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 3),
      x: this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 3)
    };
    const wallOverTheEnemy = this.boardHelper.getSquareByCoordinates(coordinatesWallOverTheEnemy, board);
    if (wallOverTheEnemy.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (!wallOverTheEnemy.isWalkable) return false;

    return true;
  }

  // Checks if a player can jump to a square diagonally.
  // It starts by checking horizontally if argument 'startFromHorizontal' is set to true.
  // There has to be other player blocking the way in selected direction, wall behind it (to block linear jump)
  // and no walls to prevent jumping diagonally.
  checkDiagonalFromOneSide(
    coordinatesSquare: Coordinates,
    coordinatesPlayer: Coordinates,
    board: Board,
    startFromHorizontal: boolean
  ): boolean {
    const square = this.boardHelper.getSquareByCoordinates(coordinatesSquare, board);
    if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
    // When targeted square is occupied by player
    if (square.playerId) return false;

    // When wall to the side of player's origin square is not walkable (1st square from player square)
    const coordinatesWallNearPlayer: Coordinates = {
      y: startFromHorizontal
        ? coordinatesPlayer.y
        : this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 1),
      x: startFromHorizontal
        ? this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 1)
        : coordinatesPlayer.x
    };
    const wallNearPlayer = this.boardHelper.getSquareByCoordinates(coordinatesWallNearPlayer, board);
    if (wallNearPlayer.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (!wallNearPlayer.isWalkable) return false;

    // When player square to the side of player's origin is not an enemy
    const coordinatesEnemy: Coordinates = {
      y: startFromHorizontal ? coordinatesPlayer.y : coordinatesSquare.y,
      x: startFromHorizontal ? coordinatesSquare.x : coordinatesPlayer.x
    };
    const enemy = this.boardHelper.getSquareByCoordinates(coordinatesEnemy, board);
    if (enemy.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
    if (!enemy.playerId) return false;

    // When wall between the targeted square and the enemy square is not walkable (adds 1 offset to coordinates in opposite cases than the wall near the player)
    const coordinatesWallBetweenTargetAndEnemy: Coordinates = {
      y: startFromHorizontal
        ? this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 1)
        : coordinatesSquare.y,
      x: startFromHorizontal
        ? coordinatesSquare.x
        : this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 1)
    };
    const wallBetweenTargetAndEnemy = this.boardHelper.getSquareByCoordinates(
      coordinatesWallBetweenTargetAndEnemy,
      board
    );
    if (wallBetweenTargetAndEnemy.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (!wallBetweenTargetAndEnemy.isWalkable) return false;

    // When targeted square is not near the border of the board or there is no wall that would block linear jump (3rd square from player square)
    const coordinatesWallOverTheEnemy: Coordinates = {
      y: startFromHorizontal
        ? coordinatesPlayer.y
        : this.coordinateOffsetSquare(coordinatesSquare.y, coordinatesPlayer.y, 3),
      x: startFromHorizontal
        ? this.coordinateOffsetSquare(coordinatesSquare.x, coordinatesPlayer.x, 3)
        : coordinatesPlayer.x
    };

    if (!this.isCoordinateWithinBoard(coordinatesWallOverTheEnemy)) {
      return true;
    }
    const wallOverTheEnemy = this.boardHelper.getSquareByCoordinates(coordinatesWallOverTheEnemy, board);
    if (wallOverTheEnemy.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (wallOverTheEnemy.isWalkable) return false;

    return true;
  }

  isCoordinateWithinBoard = (coordinates: Coordinates) => {
    return (
      coordinates.y >= 0 && coordinates.y <= LAST_ROW_INDEX && coordinates.x >= 0 && coordinates.x <= LAST_ROW_INDEX
    );
  };

  // To check if player can move diagonally in each direction, two ways must be checked: start checking horizontally and move on to vertically and the opposite.
  checkDiagonal = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
    // Check diagonal starting horizontally, then starting vertically
    return (
      this.checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, true) ||
      this.checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, false)
    );
  };

  updatePlayerMoves = (coordinatesPlayer: Coordinates, board: Board) => {
    this.resetMoves(board);
    const DISTANCE_BETWEEN_PLAYER_SQUARES = 2;
    const JUMP_DISTANCE_FROM_TARGET_TO_PLAYER = DISTANCE_BETWEEN_PLAYER_SQUARES * 2;

    const coordinatesOfAllLinearMoves = [
      { y: coordinatesPlayer.y - DISTANCE_BETWEEN_PLAYER_SQUARES, x: coordinatesPlayer.x },
      { y: coordinatesPlayer.y + DISTANCE_BETWEEN_PLAYER_SQUARES, x: coordinatesPlayer.x },
      { y: coordinatesPlayer.y, x: coordinatesPlayer.x - DISTANCE_BETWEEN_PLAYER_SQUARES },
      { y: coordinatesPlayer.y, x: coordinatesPlayer.x + DISTANCE_BETWEEN_PLAYER_SQUARES }
    ];
    for (const coordinatesCurrent of coordinatesOfAllLinearMoves) {
      if (
        this.isCoordinateWithinBoard(coordinatesCurrent) &&
        this.checkLinear(coordinatesCurrent, coordinatesPlayer, board)
      ) {
        board[coordinatesCurrent.y].squares[coordinatesCurrent.x].isAvailable = true;
      }
    }

    const coordinatesOfAllDiagonalMoves = [
      {
        y: coordinatesPlayer.y + DISTANCE_BETWEEN_PLAYER_SQUARES,
        x: coordinatesPlayer.x + DISTANCE_BETWEEN_PLAYER_SQUARES
      },
      {
        y: coordinatesPlayer.y + DISTANCE_BETWEEN_PLAYER_SQUARES,
        x: coordinatesPlayer.x - DISTANCE_BETWEEN_PLAYER_SQUARES
      },
      {
        y: coordinatesPlayer.y - DISTANCE_BETWEEN_PLAYER_SQUARES,
        x: coordinatesPlayer.x + DISTANCE_BETWEEN_PLAYER_SQUARES
      },
      {
        y: coordinatesPlayer.y - DISTANCE_BETWEEN_PLAYER_SQUARES,
        x: coordinatesPlayer.x - DISTANCE_BETWEEN_PLAYER_SQUARES
      }
    ];
    for (const coordinatesCurrent of coordinatesOfAllDiagonalMoves) {
      if (
        this.isCoordinateWithinBoard(coordinatesCurrent) &&
        this.checkDiagonal(coordinatesCurrent, coordinatesPlayer, board)
      ) {
        board[coordinatesCurrent.y].squares[coordinatesCurrent.x].isAvailable = true;
      }
    }

    const coordinatesOfAllLinearJumps = [
      { y: coordinatesPlayer.y - JUMP_DISTANCE_FROM_TARGET_TO_PLAYER, x: coordinatesPlayer.x },
      { y: coordinatesPlayer.y + JUMP_DISTANCE_FROM_TARGET_TO_PLAYER, x: coordinatesPlayer.x },
      { y: coordinatesPlayer.y, x: coordinatesPlayer.x - JUMP_DISTANCE_FROM_TARGET_TO_PLAYER },
      { y: coordinatesPlayer.y, x: coordinatesPlayer.x + JUMP_DISTANCE_FROM_TARGET_TO_PLAYER }
    ];
    for (const coordinatesCurrent of coordinatesOfAllLinearJumps) {
      if (
        this.isCoordinateWithinBoard(coordinatesCurrent) &&
        this.checkLinearJump(coordinatesCurrent, coordinatesPlayer, board)
      ) {
        board[coordinatesCurrent.y].squares[coordinatesCurrent.x].isAvailable = true;
      }
    }
  };
}
