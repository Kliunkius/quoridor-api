import { Board, Coordinates, SquareType, getSquareByCoordinates } from './boardHelper';

// the board is 17x17 because we count walls as seperate squares
// board height is also 17 because the board is square
const BOARD_WIDTH = 17;

// Sets all squares of type 'Player' to unavailable.
// Used when available moves have to recalculated for other user.
const resetMoves = (board: Board) => {
  const keys = Object.keys(board);
  keys.map((rowKey) => {
    const row = board[Number(rowKey)];
    row.squares.map((square) => {
      if (square.type === SquareType.Player) {
        square.isAvailable = false;
      }
    });
  });
};

// Checks if a player can walk to squares to his left, right, top, bottom (depends on which this is called).
const checkLinear = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
  const square = getSquareByCoordinates(coordinatesSquare, board);
  if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");

  // When square is already occupied by other player
  if (square.playerId) return false;

  // When there is a wall between player and targeted square
  const coordinatesWallInBetween: Coordinates = {
    y: coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2, // division by 2, because coordinate difference between player and targeted square is 2 and we select the middle square
    x: coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2
  };
  const wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
  if (!wallInBetween.isWalkable) return false;
  return true;
};

// Checks if a player can jump over to a square 2 blocks away in each direction (depends on which this is called).
// In order to be able to, there have to be no blocking walls and there has to other player between targeted and current position squares.
const checkLinearJump = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
  const square = getSquareByCoordinates(coordinatesSquare, board);
  if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");

  // When there is a wall between player and targeted square (space closest to player)
  let coordinatesWallInBetween: Coordinates = {
    y: coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 4, // division by 4, because coordinate difference between player and targeted square is 4 and we select the square closest to the player
    x: coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 4
  };
  let wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
  if (!wallInBetween.isWalkable) return false;

  // When there no other player between player and targeted square
  const coordinatesPlayerInBetween: Coordinates = {
    y: coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2, // division by 2, because coordinate difference between player and targeted square is 4 and we select the middle square (x / 4 * 2 = x / 2)
    x: coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2
  };
  const playerInBetween = getSquareByCoordinates(coordinatesPlayerInBetween, board);
  if (playerInBetween.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
  if (!playerInBetween.playerId) return false;

  // When there is a wall between player and targeted square (space closest to targeted square)
  coordinatesWallInBetween = {
    y: coordinatesPlayer.y + ((coordinatesSquare.y - coordinatesPlayer.y) / 4) * 3, // division by 4 and multiplication by 3, because coordinate difference between player and targeted square is 4 and we select the square between the middle square and targeted square
    x: coordinatesPlayer.x + ((coordinatesSquare.x - coordinatesPlayer.x) / 4) * 3
  };
  wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
  if (!wallInBetween.isWalkable) return false;

  return true;
};

// Checks if a player can jump to a square diagonally.
// It starts by checking horizontally if argument 'startFromHorizontal' is set to true.
// There has to be other player blocking the way in selected direction, wall behind it (to block linear jump)
// and no walls to prevent jumping diagonally.
const checkDiagonalFromOneSide = (
  coordinatesSquare: Coordinates,
  coordinatesPlayer: Coordinates,
  board: Board,
  startFromHorizontal: boolean
): boolean => {
  const square = getSquareByCoordinates(coordinatesSquare, board);
  if (square.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
  // When targeted square is occupied by player
  if (square.playerId) return false;

  // When wall to the side of player's origin square is not walkable
  let coordinatesWallInBetween: Coordinates = {
    y: startFromHorizontal
      ? coordinatesPlayer.y
      : coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2, // division by 2, because coordinate difference between player and targeted square is 2 and we select the middle square
    x: startFromHorizontal ? coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2 : coordinatesPlayer.x
  };
  let wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
  if (!wallInBetween.isWalkable) return false;

  // When player square to the side of player's origin is not other player
  const coordinatesPlayerInBetween: Coordinates = {
    y: startFromHorizontal ? coordinatesPlayer.y : coordinatesSquare.y,
    x: startFromHorizontal ? coordinatesSquare.x : coordinatesPlayer.x
  };
  const playerInBetween = getSquareByCoordinates(coordinatesPlayerInBetween, board);
  if (playerInBetween.type !== SquareType.Player) throw new Error("Square is not of type 'Player'");
  if (!playerInBetween.playerId) return false;

  // When wall between the targeted square and previous square is not walkable
  coordinatesWallInBetween = {
    y: startFromHorizontal
      ? coordinatesPlayer.y + (coordinatesSquare.y - coordinatesPlayer.y) / 2 // division by 2, because coordinate difference between player and targeted square is 2 and we select the middle square
      : coordinatesSquare.y,
    x: startFromHorizontal ? coordinatesSquare.x : coordinatesPlayer.x + (coordinatesSquare.x - coordinatesPlayer.x) / 2
  };
  wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
  if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
  if (!wallInBetween.isWalkable) return false;

  // When targeted square is not near the border of the board or there is no wall that would block linear jump
  const LAST_ROW_INDEX = BOARD_WIDTH - 1;
  if (
    (startFromHorizontal ? coordinatesSquare.x : coordinatesSquare.y) !== 0 &&
    (startFromHorizontal ? coordinatesSquare.x : coordinatesSquare.y) !== LAST_ROW_INDEX
  ) {
    coordinatesWallInBetween = {
      y: startFromHorizontal
        ? coordinatesPlayer.y
        : coordinatesPlayer.y + ((coordinatesSquare.y - coordinatesPlayer.y) / 2) * 3, // division by 2 and multiplication by 3, because coordinate difference between player and targeted square is 2 and we select the square that is over the targeted square
      x: startFromHorizontal
        ? coordinatesPlayer.x + ((coordinatesSquare.x - coordinatesPlayer.x) / 2) * 3
        : coordinatesPlayer.x
    };
    wallInBetween = getSquareByCoordinates(coordinatesWallInBetween, board);
    if (wallInBetween.type !== SquareType.Wall) throw new Error("Square is not of type 'Wall'");
    if (wallInBetween.isWalkable) return false;
  }

  return true;
};

// To check if player can move diagonally in each direction, two ways must be checked: start checking horizontally and move on to vertically and the opposite.
const checkDiagonal = (coordinatesSquare: Coordinates, coordinatesPlayer: Coordinates, board: Board): boolean => {
  if (
    // Check diagonal starting horizontally, then starting vertically
    checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, true) ||
    checkDiagonalFromOneSide(coordinatesSquare, coordinatesPlayer, board, false)
  ) {
    return true;
  }
  return false;
};

export const updatePlayerMoves = (coordinatesPlayer: Coordinates, board: Board) => {
  resetMoves(board);
  // Go through sqaures around the player (both linear and diagonal)
  const DISTANCE_BETWEEN_PLAYER_SQUARES = 2;
  for (
    let relativeIndexY = -DISTANCE_BETWEEN_PLAYER_SQUARES;
    relativeIndexY <= DISTANCE_BETWEEN_PLAYER_SQUARES;
    relativeIndexY += DISTANCE_BETWEEN_PLAYER_SQUARES
  ) {
    for (
      let relativeIndexX = -DISTANCE_BETWEEN_PLAYER_SQUARES;
      relativeIndexX <= DISTANCE_BETWEEN_PLAYER_SQUARES;
      relativeIndexX += DISTANCE_BETWEEN_PLAYER_SQUARES
    ) {
      const coordinatesSquare: Coordinates = {
        y: coordinatesPlayer.y + relativeIndexY,
        x: coordinatesPlayer.x + relativeIndexX
      };
      // Move to the next square when calculated coordinates are outside the board
      if (
        coordinatesSquare.y < 0 ||
        coordinatesSquare.y >= BOARD_WIDTH ||
        coordinatesSquare.x < 0 ||
        coordinatesSquare.x >= BOARD_WIDTH
      ) {
        continue;
      }
      if (board[coordinatesSquare.y].squares[coordinatesSquare.x].type !== SquareType.Player)
        throw new Error("Square is not of type 'Player'");
      // When targeted square coordinates are diagonal to player coordinates
      if (
        Math.abs(relativeIndexX) === DISTANCE_BETWEEN_PLAYER_SQUARES &&
        Math.abs(relativeIndexY) === DISTANCE_BETWEEN_PLAYER_SQUARES &&
        checkDiagonal(coordinatesSquare, coordinatesPlayer, board)
      ) {
        board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
      }
      // When targeted square coordinates are linear to player coordinates
      else if (
        ((Math.abs(relativeIndexX) === DISTANCE_BETWEEN_PLAYER_SQUARES && Math.abs(relativeIndexY) === 0) ||
          (Math.abs(relativeIndexX) === 0 && Math.abs(relativeIndexY) === DISTANCE_BETWEEN_PLAYER_SQUARES)) &&
        checkLinear(coordinatesSquare, coordinatesPlayer, board)
      ) {
        board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
      }
    }
  }

  // The following checks linear jump availability in all 4 directions:

  const JUMP_DISTANCE_FROM_TARGET_TO_PLAYER = 4;

  // Check top
  let coordinatesSquare: Coordinates = {
    y: coordinatesPlayer.y - JUMP_DISTANCE_FROM_TARGET_TO_PLAYER,
    x: coordinatesPlayer.x
  };
  if (coordinatesSquare.y >= 0 && checkLinearJump(coordinatesSquare, coordinatesPlayer, board)) {
    board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
  }

  // Check bottom
  coordinatesSquare = {
    y: coordinatesPlayer.y + JUMP_DISTANCE_FROM_TARGET_TO_PLAYER,
    x: coordinatesPlayer.x
  };
  if (coordinatesSquare.y < BOARD_WIDTH && checkLinearJump(coordinatesSquare, coordinatesPlayer, board)) {
    board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
  }

  // Check right
  coordinatesSquare = {
    y: coordinatesPlayer.y,
    x: coordinatesPlayer.x + JUMP_DISTANCE_FROM_TARGET_TO_PLAYER
  };
  if (coordinatesSquare.x < BOARD_WIDTH && checkLinearJump(coordinatesSquare, coordinatesPlayer, board)) {
    board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
  }

  // Check left
  coordinatesSquare = {
    y: coordinatesPlayer.y,
    x: coordinatesPlayer.x - JUMP_DISTANCE_FROM_TARGET_TO_PLAYER
  };
  if (coordinatesSquare.x >= 0 && checkLinearJump(coordinatesSquare, coordinatesPlayer, board)) {
    board[coordinatesSquare.y].squares[coordinatesSquare.x].isAvailable = true;
  }
};
