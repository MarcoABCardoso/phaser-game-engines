export function createWorldHud({ scene, model }) {
  const heading = scene.add.text(16, 48, model.heading, {
    fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
  }).setScrollFactor(0).setDepth(100);
  const quest = scene.add.text(680, 16, '', {
    fontFamily: 'sans-serif', fontSize: '15px', color: '#e0e7ff',
    backgroundColor: '#111827dd', padding: { x: 12, y: 10 }, lineSpacing: 5,
    wordWrap: { width: 240 },
  }).setScrollFactor(0).setDepth(100);
  const status = scene.add.text(16, 82, '', {
    fontFamily: 'sans-serif', fontSize: '14px', color: '#bae6fd',
    backgroundColor: '#0f172acc', padding: { x: 8, y: 6 }, lineSpacing: 4,
  }).setScrollFactor(0).setDepth(100);
  return {
    root: heading,
    update(next) {
      heading.setText(next.heading);
      quest.setText([next.quest.label, ...next.quest.lines]);
      status.setText(next.status);
      for (const text of [heading, quest, status]) text.setScale(next.textScale ?? 1);
    },
    destroy() {
      heading.destroy();
      quest.destroy();
      status.destroy();
    },
  };
}

export function createWorldDialogue({ scene, model }) {
  const dialogueText = (next) => [
    next.text,
    ...(next.choices?.map((choice, index) => `${index + 1}. ${choice.label}`) ?? []),
  ];
  const panel = scene.add.rectangle(480, 452, 860, 130, 0x090f1f, 0.96)
    .setStrokeStyle(2, 0xa78bfa).setScrollFactor(0).setDepth(200);
  const speaker = scene.add.text(76, 400, model.speaker, {
    fontFamily: 'sans-serif', fontSize: '18px', color: '#c4b5fd', fontStyle: 'bold',
  }).setScrollFactor(0).setDepth(201);
  const body = scene.add.text(76, 430, dialogueText(model), {
    fontFamily: 'sans-serif', fontSize: '17px', color: '#f8fafc',
    wordWrap: { width: 808 }, lineSpacing: 5,
  }).setScrollFactor(0).setDepth(201);
  const prompt = scene.add.text(874, 492, 'E / Action', {
    fontFamily: 'sans-serif', fontSize: '13px', color: '#a5b4fc',
  }).setOrigin(1).setScrollFactor(0).setDepth(201);
  return {
    root: panel,
    update(next) {
      speaker.setText(next.speaker);
      body.setText(dialogueText(next));
      for (const text of [speaker, body, prompt]) text.setScale(next.textScale ?? 1);
    },
    destroy() {
      panel.destroy();
      speaker.destroy();
      body.destroy();
      prompt.destroy();
    },
  };
}
