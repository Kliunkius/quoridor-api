enum BoardTypes {
  Square,
  Wall
}

enum RowTypes {
  Mixed,
  Walls
}

type BoardSquare<T> = T extends BoardTypes.Square
  ? { type: T; playerId?: number }
  : T extends BoardTypes.Wall
    ? { type: T; isPlaced: boolean }
    : never;

type BoardRow<T> = { type: RowTypes; row: BoardSquare<T>[] };

export type Board = Record<number, BoardRow<BoardTypes>>;

// the board is 17x17 because we count walls as seperate squares
// board height is also 17 because the board is square
const BOARD_WIDTH = 17;

const createRow = (type: RowTypes): BoardRow<BoardTypes> => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const row: BoardRow<BoardTypes> = {
    type,
    row:
      type === RowTypes.Mixed
        ? array.map((index) => {
            return index % 2 ? { type: BoardTypes.Square } : { type: BoardTypes.Wall, isPlaced: false };
          })
        : array.map(() => ({ type: BoardTypes.Wall, isPlaced: false }))
  };
  return row;
};

export const createNewBoard = (): Board => {
  const array = Array.from(Array(BOARD_WIDTH).keys());
  const board = array.reduce((map: Board, index) => {
    map[index] = index % 2 ? createRow(RowTypes.Mixed) : createRow(RowTypes.Walls);
    return map;
  }, {});
  return board;
};
