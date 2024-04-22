import fs from 'fs';
import readline from 'readline';
import { createNewBoard, getSquareByCoordinates } from '../BoardService/helper';
import { BOARD_WIDTH, PLAYER1_STARTING_POSITION, PLAYER2_STARTING_POSITION } from '../BoardService/types';
import { Board, BoardRow, BoardSquare, Player, Room, RowTypes, SquareType } from '../StateHandler/types';

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

export const translateTextToBoard = async (path: string): Promise<Board> => {
  // Create a Readable stream from the file
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity // To handle Windows line endings (\r\n)
  });

  const boardPromise = (): Promise<Board> => {
    return new Promise((resolve, reject) => {
      const board: Board = {};
      let indexY: number = 0;
      let linesRead = 0;

      // Read line by line
      rl.on('line', (line) => {
        if (linesRead < BOARD_WIDTH) {
          board[indexY] = translateTextToRow(line, indexY % 2 === 0 ? RowTypes.Mixed : RowTypes.Walls);
          indexY++;
        }
        linesRead++;
      });

      // Close the readline interface and release resources once all lines are read
      rl.on('close', () => {
        console.log('End of file reached.');
        resolve(board);
      });
    });
  };

  const board = await boardPromise();

  return board;
};

const translateTextToRow = (rowTxt: string, rowType: RowTypes): BoardRow<SquareType> => {
  const row: BoardRow<SquareType> = { type: rowType, squares: [] };
  const symbols = rowTxt.split(' ');
  symbols.forEach((symbol) => {
    let square;
    switch (symbol) {
      case '-':
      case '|': {
        square = {
          type: SquareType.Wall,
          isAvailable: true,
          isWalkable: true,
          isPlaced: false
        } as BoardSquare<SquareType.Wall>;
        break;
      }
      case 'O': {
        square = { type: SquareType.Player, isAvailable: true } as BoardSquare<SquareType.Player>;
        break;
      }
      case '1': {
        square = {
          type: SquareType.Player,
          isAvailable: false,
          playerId: 'user-id1'
        } as BoardSquare<SquareType.Player>;
        break;
      }
      case '2': {
        square = {
          type: SquareType.Player,
          isAvailable: false,
          playerId: 'user-id2'
        } as BoardSquare<SquareType.Player>;
        break;
      }
      case 'W': {
        square = {
          type: SquareType.Wall,
          isAvailable: false,
          isWalkable: false,
          isPlaced: true
        } as BoardSquare<SquareType.Wall>;
        break;
      }
      case '+':
      case 'U': {
        square = {
          type: SquareType.Wall,
          isAvailable: false,
          isWalkable: true,
          isPlaced: false
        } as BoardSquare<SquareType.Wall>;
        break;
      }
    }
    row.squares.push(square);
  });

  return row;
};
