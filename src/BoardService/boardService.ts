import _ from 'lodash';
import { injectable, inject } from 'inversify';

import { BOARD_WIDTH, Move, PLAYER1_FINISH_ROW, PLAYER2_FINISH_ROW } from './types';
import { StateHandler } from '../StateHandler/stateHandler';
import { Board, BoardSquare, Coordinates, Role, Room, RowTypes, SquareType } from '../StateHandler/types';
import { TYPES } from '../ioc/types';
import { getSquareByCoordinates } from './helper';
import { PlayerMoveCalculator } from '../PlayerMoveCalculator/playerMoveCalculator';
import { DISTANCE_BETWEEN_PLAYER_SQUARES } from '../PlayerMoveCalculator/types';

@injectable()
export class BoardService {
  constructor(
    @inject(TYPES.StateHandler) private stateHandler: StateHandler,
    @inject(TYPES.PlayerMoveCalculator) private playerMoveCalculator: PlayerMoveCalculator
  ) {}

  widthSearch(
    startingSquare: Coordinates,
    squares: Coordinates[],
    finishingRow: number,
    visitedSquares: Record<string, Coordinates>,
    paths: Record<string, Coordinates[]>,
    board: Board
  ): Coordinates {
    const availableSquares = _.cloneDeep(squares);
    type RecursiveSquares = {
      coordinates: Coordinates;
      previousSquareCoordinates: Coordinates;
    };

    const availableRecursiveSquares: RecursiveSquares[] = availableSquares.map((s) => ({
      coordinates: s,
      previousSquareCoordinates: startingSquare
    }));

    visitedSquares[this.getCoordinatesKey(startingSquare)] = startingSquare;
    paths[this.getCoordinatesKey(startingSquare)] = [startingSquare];

    for (const square of availableRecursiveSquares) {
      paths[this.getCoordinatesKey(square.coordinates)] = [
        ...paths[this.getCoordinatesKey(square.previousSquareCoordinates)],
        square.coordinates
      ];

      visitedSquares[this.getCoordinatesKey(square.coordinates)] = square.coordinates;

      if (square.coordinates.y === finishingRow) {
        return square.coordinates;
      }

      const nextSquares = this.playerMoveCalculator.getAvailableSquaresForPath(square.coordinates, board);
      const nextRecursiveSquares = nextSquares.reduce((arr: RecursiveSquares[], sqr) => {
        if (!_.isEmpty(visitedSquares[this.getCoordinatesKey(sqr)])) {
          return arr;
        }

        return [...arr, { coordinates: sqr, previousSquareCoordinates: square.coordinates }];
      }, []);

      availableRecursiveSquares.push(...nextRecursiveSquares);
    }

    return {} as Coordinates;
  }

  findPath(playerId: string, room: Room): Coordinates[] {
    const player = room.playerMap[playerId];

    const finishingRow = player.role === Role.PLAYER1 ? PLAYER1_FINISH_ROW : PLAYER2_FINISH_ROW;
    const availableSquares = this.playerMoveCalculator.getAvailableSquaresForPath(player.coordinates, room.board);
    const visitedSquares: Record<string, Coordinates> = {};
    const paths: Record<string, Coordinates[]> = {};

    const finishingSquare = this.widthSearch(
      player.coordinates,
      availableSquares,
      finishingRow,
      visitedSquares,
      paths,
      room.board
    );

    return paths[this.getCoordinatesKey(finishingSquare)] || [];
  }

  getCoordinatesKey(coor: Coordinates) {
    return `${coor.x}-${coor.y}`;
  }

  getMainPathBlockingCoordinates(room: Room) {
    const playerIds = Object.keys(room.playerMap);

    const paths: Coordinates[][] = [];
    for (const playerId of playerIds) {
      paths.push(this.findPath(playerId, room));
    }

    const mainPathCoordinates: Record<string, Coordinates> = {};

    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const firstSquare = path[i];
        const secondSqaure = path[i + 1];
        const isVertical = firstSquare.x === secondSqaure.x;

        let possiblyBlockedCoordinates: Coordinates[] = [];
        if (isVertical) {
          const yOffset = (firstSquare.y - secondSqaure.y) / DISTANCE_BETWEEN_PLAYER_SQUARES;
          possiblyBlockedCoordinates = [
            { x: firstSquare.x, y: firstSquare.y + yOffset },
            { x: firstSquare.x - 2, y: firstSquare.y + yOffset }
          ];
        } else {
          const xOffset = (firstSquare.x - secondSqaure.x) / DISTANCE_BETWEEN_PLAYER_SQUARES;
          possiblyBlockedCoordinates = [
            { x: firstSquare.x + xOffset, y: firstSquare.y },
            { x: firstSquare.x + xOffset, y: firstSquare.y + 2 }
          ];
        }

        for (const coordinate of possiblyBlockedCoordinates) {
          if (this.playerMoveCalculator.isCoordinateWithinBoard(coordinate)) {
            mainPathCoordinates[this.getCoordinatesKey(coordinate)] = coordinate;
          }
        }
      }
    }

    return mainPathCoordinates;
  }

  updateAvailableWallPlacements(room: Room) {
    const board = room.board;
    const mainPathCoordinatesMap = this.getMainPathBlockingCoordinates(room);

    const wallSquares: Coordinates[] = [];

    for (let y = 0; y < Object.keys(board).length; y++) {
      for (let x = 0; x < Object.values(board[y].squares).length; x++) {
        const square = board[y].squares[x];
        if (square.type === SquareType.Wall) {
          wallSquares.push({ x, y });
        }
      }
    }

    const unavailableWallSquares: Coordinates[] = [];

    for (const square of wallSquares) {
      // if (!mainPathCoordinatesMap[this.getCoordinatesKey(square)]) {
      //   continue;
      // }

      const fakeRoom = _.cloneDeep(room);

      const rowType = square.y % 2 === 0 ? RowTypes.Mixed : RowTypes.Walls;
      this.updateBoardWalls(rowType, square, fakeRoom.board);

      const playerIds = Object.keys(fakeRoom.playerMap);
      for (const playerId of playerIds) {
        if (_.isEmpty(this.findPath(playerId, fakeRoom))) {
          unavailableWallSquares.push(square);
          break;
        }
      }
    }

    for (const coordinate of unavailableWallSquares) {
      const square = getSquareByCoordinates<SquareType.Wall>(coordinate, room.board, SquareType.Wall);
      square.isAvailable = false;
    }
  }

  hasPlayerWon({ type, coordinates, userId }: Move) {
    if (type === SquareType.Wall) {
      return false;
    }

    const room = this.getRoomByUserId(userId);
    const player = room.playerMap[userId];

    return (
      (player.role === Role.PLAYER1 && coordinates.y === PLAYER1_FINISH_ROW) ||
      (player.role === Role.PLAYER2 && coordinates.y === PLAYER2_FINISH_ROW)
    );
  }

  movePiece({ type, coordinates, userId }: Move) {
    if (type === SquareType.Player) {
      const room = this.getRoomByUserId(userId);
      const player = room.playerMap[userId];
      const previousCoordinates = player.coordinates;
      const square = getSquareByCoordinates<SquareType.Player>(previousCoordinates, room.board, SquareType.Player);
      delete square.playerId;

      const newSquare = getSquareByCoordinates<SquareType.Player>(coordinates, room.board, SquareType.Player);
      newSquare.playerId = userId;

      player.coordinates = coordinates;
    }

    if (type === SquareType.Wall) {
      const room = this.getRoomByUserId(userId);
      const board = room.board;
      const row = board[coordinates.y];
      this.updateBoardWalls(row.type, coordinates, board);
    }
  }

  updateBoardWalls(rowType: RowTypes, coordinates: Coordinates, board: Board) {
    const blockedSquares: BoardSquare<SquareType.Wall>[] = [];
    const unavailableSquares: BoardSquare<SquareType.Wall>[] = [];

    const targetedSquare = getSquareByCoordinates<SquareType.Wall>(
      { y: coordinates.y, x: coordinates.x },
      board,
      SquareType.Wall
    );

    targetedSquare.isAvailable = false;
    targetedSquare.isWalkable = false;
    targetedSquare.isPlaced = true;

    if (rowType === RowTypes.Mixed) {
      const wallAbove = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y - 2, x: coordinates.x },
        board,
        SquareType.Wall
      );
      if (wallAbove) {
        blockedSquares.push(wallAbove);
      }

      // Check if coordinates are not next to the top border
      if (coordinates.y < BOARD_WIDTH - 1) {
        const squareUnder = getSquareByCoordinates<SquareType.Wall>(
          { y: coordinates.y + 2, x: coordinates.x },
          board,
          SquareType.Wall
        );
        if (squareUnder) {
          unavailableSquares.push(squareUnder);
        }
      }

      const squareTopLeft = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y - 1, x: coordinates.x - 1 },
        board,
        SquareType.Wall
      );
      if (squareTopLeft) {
        unavailableSquares.push(squareTopLeft);
      }
    }

    if (rowType === RowTypes.Walls) {
      const wallToTheRight = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y, x: coordinates.x + 2 },
        board,
        SquareType.Wall
      );
      if (wallToTheRight) {
        blockedSquares.push(wallToTheRight);
      }

      // Check if coordinates are not next to the left border
      if (coordinates.x > 0) {
        const squareToTheLeft = getSquareByCoordinates<SquareType.Wall>(
          { y: coordinates.y, x: coordinates.x - 2 },
          board,
          SquareType.Wall
        );
        if (squareToTheLeft) {
          unavailableSquares.push(squareToTheLeft);
        }
      }

      const squareBottomRight = getSquareByCoordinates<SquareType.Wall>(
        { y: coordinates.y + 1, x: coordinates.x + 1 },
        board,
        SquareType.Wall
      );
      if (squareBottomRight) {
        unavailableSquares.push(squareBottomRight);
      }
    }

    for (const square of blockedSquares) {
      square.isWalkable = false;
      square.isAvailable = false;
    }

    for (const square of unavailableSquares) {
      square.isAvailable = false;
    }
  }

  getRoomByUserId(userId: string) {
    const user = this.stateHandler.getUser(userId);
    const roomCode = user.roomCode;
    return this.stateHandler.getRoom(roomCode);
  }
}
