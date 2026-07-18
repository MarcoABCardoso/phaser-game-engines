const GARDEN_WALL_COLOR = 0x294c3b;
const PLANT_BED_COLOR = 0x315b43;

const gardenBoundary = [
  { x: 0, y: 0, w: 960, h: 24, color: GARDEN_WALL_COLOR },
  { x: 0, y: 516, w: 960, h: 24, color: GARDEN_WALL_COLOR },
  { x: 0, y: 0, w: 24, h: 540, color: GARDEN_WALL_COLOR },
  { x: 936, y: 0, w: 24, h: 540, color: GARDEN_WALL_COLOR },
];

const plantBeds = [
  { x: 210, y: 105, w: 170, h: 52, color: PLANT_BED_COLOR },
  { x: 580, y: 90, w: 180, h: 58, color: PLANT_BED_COLOR },
  { x: 300, y: 370, w: 190, h: 58, color: PLANT_BED_COLOR },
  { x: 680, y: 350, w: 150, h: 62, color: PLANT_BED_COLOR },
];

const specimens = [
  {
    type: 'interactable',
    id: 'moon-orchid',
    x: 180,
    y: 190,
    color: 0xc7ddff,
    label: 'Observe moon orchid',
    zone: { x: 145, y: 160, w: 70, h: 70 },
    message: 'Moon orchid: its pale petals turn toward shaded water.',
  },
  {
    type: 'interactable',
    id: 'copper-fern',
    x: 520,
    y: 175,
    color: 0xd79a61,
    label: 'Observe copper fern',
    zone: { x: 485, y: 140, w: 70, h: 70 },
    message: 'Copper fern: new fronds carry a warm metallic sheen.',
  },
  {
    type: 'interactable',
    id: 'star-moss',
    x: 250,
    y: 335,
    color: 0x8ed081,
    label: 'Observe star moss',
    zone: { x: 215, y: 300, w: 70, h: 70 },
    message: 'Star moss: each rosette stores a bright bead of rain.',
  },
  {
    type: 'interactable',
    id: 'bell-vine',
    x: 650,
    y: 300,
    color: 0xb99be6,
    label: 'Observe bell vine',
    zone: { x: 615, y: 265, w: 70, h: 70 },
    message: 'Bell vine: hollow flowers hum softly when the wind changes.',
  },
];

export const specimenCount = specimens.length;

export const surveyLevel = {
  world: { width: 960, height: 540 },
  spawn: { x: 92, y: 270 },
  walls: [...gardenBoundary, ...plantBeds],
  entitySpecs: specimens,
};
