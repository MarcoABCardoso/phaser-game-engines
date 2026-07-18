export const basicLevel = {
  id: 'basic-sample',
  world: { width: 960, height: 540 },
  spawn: { x: 92, y: 420 },
  floorSegments: [
    { x: 0, y: 480, w: 960, h: 60 },
  ],
  platforms: [
    { id: 'step-1', x: 190, y: 410, w: 130, h: 20, kind: 'step' },
    { id: 'step-2', x: 400, y: 340, w: 150, h: 20, kind: 'platform' },
    { id: 'thin-1', x: 650, y: 270, w: 160, h: 14, kind: 'thin' },
  ],
  labels: [
    { x: 24, y: 454, text: 'A/D or arrows: move   Space/Up: jump' },
    { x: 650, y: 246, text: 'one-way platform' },
  ],
  checkpoints: [],
  entitySpecs: [],
};
