const boundaryWalls = [
  { x: 0, y: 0, w: 1920, h: 24 },
  { x: 0, y: 516, w: 1920, h: 24 },
  { x: 0, y: 0, w: 24, h: 540 },
  { x: 1896, y: 0, w: 24, h: 540 },
];

const mapDividers = [
  { x: 936, y: 0, w: 24, h: 540 },
  { x: 360, y: 120, w: 36, h: 270 },
];

const groveObstacles = [
  { x: 1220, y: 110, w: 70, h: 70, color: 0x356047 },
  { x: 1460, y: 300, w: 100, h: 45, color: 0x356047 },
  { x: 1680, y: 130, w: 55, h: 130, color: 0x356047 },
];

const entities = [
  {
    type: 'pickup',
    id: 'coin',
    item: 'coin',
    x: 220,
    y: 160,
    goneFlag: 'coin-collected',
  },
  {
    type: 'sign',
    id: 'sign',
    x: 180,
    y: 250,
    zone: { x: 150, y: 220, w: 60, h: 60 },
    prompt: 'E: read sign',
    message: 'The east gate leads to the grove.',
  },
  {
    type: 'enemy',
    id: 'slime',
    x: 620,
    y: 240,
    health: 2,
  },
  {
    type: 'portal',
    id: 'east-gate',
    zone: { x: 890, y: 220, w: 40, h: 100 },
    marker: { x: 912, y: 270, label: 'GROVE' },
    to: 'grove',
    entry: { x: 1030, y: 270 },
  },
  {
    type: 'portal',
    id: 'west-gate',
    zone: { x: 960, y: 220, w: 50, h: 100 },
    marker: { x: 985, y: 270, label: 'VILLAGE' },
    to: 'village',
    entry: { x: 860, y: 270 },
  },
];

export const basicTopDownLevel = {
  world: { width: 1920, height: 540 },
  spawn: { x: 100, y: 100 },
  // Village and grove are separate sections divided by a wall and two portals.
  walls: [...boundaryWalls, ...mapDividers, ...groveObstacles],
  entitySpecs: entities,
};
