export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians) {
  return (radians * 180) / Math.PI;
}

export function normalizeAngle(angle) {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

export function shortestAngleBetween(angle1, angle2) {
  const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
  return diff < -Math.PI ? diff + Math.PI * 2 : diff;
}

export function lerpAngle(start, end, t) {
  const diff = shortestAngleBetween(start, end);
  return normalizeAngle(start + diff * t);
}

export function vectorFromAngle(angle, magnitude = 1) {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  };
}

export function angleFromVector(x, y) {
  return Math.atan2(y, x);
}

export function distanceBetween(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function normalize(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: x / length,
    y: y / length,
  };
}

export function dotProduct(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

export function crossProduct(x1, y1, x2, y2) {
  return x1 * y2 - y1 * x2;
}

export function reflect(x, y, normalX, normalY) {
  const dot = dotProduct(x, y, normalX, normalY);
  return {
    x: x - 2 * dot * normalX,
    y: y - 2 * dot * normalY,
  };
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function smoothStep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
