export const coordinateOffsetSquare = (coordinateSquare: number, coordinatePlayer: number, offset: number): number => {
  const difference = coordinateSquare - coordinatePlayer;
  if (difference === 0) return coordinatePlayer;
  return coordinatePlayer + (difference / Math.abs(difference)) * offset;
};
