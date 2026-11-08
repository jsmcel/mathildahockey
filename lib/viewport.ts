export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 560;
export const PUCK_OFFSET_X = 44;
export const PUCK_OFFSET_Y = 29;

// One scale for both axes: circles and characters retain their shape on rotation.
export function fitViewport(width: number, height: number) {
  const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
  return {
    scale,
    x: (width - WORLD_WIDTH * scale) / 2,
    y: (height - WORLD_HEIGHT * scale) / 2,
  };
}

export function pointOnIce(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const fit = fitViewport(width, height);
  if (fit.scale <= 0) return null;
  const worldX = (x - fit.x) / fit.scale;
  const worldY = (y - fit.y) / fit.scale;
  if (worldX < 0 || worldX > WORLD_WIDTH || worldY < 0 || worldY > WORLD_HEIGHT)
    return null;
  return { x: worldX, y: worldY };
}
