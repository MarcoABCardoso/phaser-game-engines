// Phaser-free movement decisions, so games can test their feel without a canvas.
export function resolveMovement({ left = false, right = false, up = false, down = false, speed = 200 }) {
  const x = (right ? 1 : 0) - (left ? 1 : 0);
  const y = (down ? 1 : 0) - (up ? 1 : 0);
  if (!x && !y) return { x: 0, y: 0 };
  const scale = x && y ? Math.SQRT1_2 : 1;
  return { x: x * speed * scale, y: y * speed * scale };
}

export function facingFromVelocity(x, y, fallback = 'down') {
  if (!x && !y) return fallback;
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}
