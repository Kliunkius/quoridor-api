import 'reflect-metadata';
import { translateTextToBoard } from '../testHelper';
import { getPlayerCoordinates } from '../../BoardService/helper';
import { PlayerMoveCalculator } from '../../PlayerMoveCalculator/playerMoveCalculator';
import { SquareType } from '../../StateHandler/types';

describe('playerMoveCalculator unit tests', () => {
  let playerMoveCalculator: PlayerMoveCalculator;
  const USER_ID = 'user-id1';

  beforeEach(() => {
    playerMoveCalculator = new PlayerMoveCalculator();
  });

  describe('#updatePlayerMoves', () => {
    it('should approve correct moves', async () => {
      const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
      const playerCoordinates = getPlayerCoordinates(USER_ID, board);
      const x = playerCoordinates.x;
      const y = playerCoordinates.y;
      playerMoveCalculator.updatePlayerMoves(playerCoordinates, board);
      const availableMoves = [
        { x: x, y: y - 2 }, // Move up
        { x: x - 2, y: y }, // Move left
        { x: x - 2, y: y + 2 }, // Jump bottom left
        { x: x + 2, y: y + 2 } // Jump bottom right
      ];
      const unavailableMoves = [
        { x: x, y: y + 2 }, // Move down
        { x: x + 2, y: y }, // Move right
        { x: x - 2, y: y - 2 }, // Jump top left
        { x: x + 2, y: y - 2 }, // Jump top right
        { x: x, y: y - 4 } // Linear jump down
      ];
      for (const coordinatesCurrent of availableMoves) {
        const isAvailable = board[coordinatesCurrent.y].squares[coordinatesCurrent.x].isAvailable;
        expect(isAvailable).toBe(true);
      }
      for (const coordinatesCurrent of unavailableMoves) {
        const isAvailable = board[coordinatesCurrent.y].squares[coordinatesCurrent.x].isAvailable;
        expect(isAvailable).toBe(false);
      }
    });
  });

  describe('#checkLinearMoves', () => {
    describe('#available', () => {
      it('should let the player go up', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player go down', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player go right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player go left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });
    });

    describe('#blocked', () => {
      it('should block the player from going up', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from going down', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from going right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from going left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinear(
          { y: playerCoordinates.y, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });
    });
  });

  describe('#checkLinearJumps', () => {
    describe('#available', () => {
      it('should let the player jump up', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board3.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y - 4, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump down', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board3.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y + 4, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board3.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y, x: playerCoordinates.x + 4 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board3.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y, x: playerCoordinates.x - 4 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });
    });

    describe('#blocked', () => {
      it('should block the player from jumping up', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y - 4, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping down', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y + 4, x: playerCoordinates.x },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y, x: playerCoordinates.x + 4 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkLinearJump(
          { y: playerCoordinates.y, x: playerCoordinates.x - 4 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });
    });
  });

  describe('#checkDiagonalJumps', () => {
    describe('#available', () => {
      it('should let the player jump up right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump up left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump down right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });

      it('should let the player jump down left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(true);
      });
    });

    describe('#available', () => {
      it('should block the player from jumping up right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping up left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y - 2, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping down right', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x + 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });

      it('should block the player from jumping down left', async () => {
        const board = await translateTextToBoard('./src/tests/mockBoards/board2.txt');
        const playerCoordinates = getPlayerCoordinates(USER_ID, board);
        const isNextMovePossible = playerMoveCalculator.checkDiagonal(
          { y: playerCoordinates.y + 2, x: playerCoordinates.x - 2 },
          playerCoordinates,
          await board
        );
        expect(isNextMovePossible).toBe(false);
      });
    });
  });

  describe('#resetMoves', () => {
    it('should make all moves unavailable', async () => {
      const board = await translateTextToBoard('./src/tests/mockBoards/board1.txt');
      playerMoveCalculator.resetMoves(board);
      const keys = Object.keys(board);
      keys.map((rowKey) => {
        const row = board[Number(rowKey)];
        row.squares.map((square) => {
          if (square.type === SquareType.Player) {
            const isAvailable = square.isAvailable;
            expect(isAvailable).toBe(false);
          }
        });
      });
    });
  });
});
