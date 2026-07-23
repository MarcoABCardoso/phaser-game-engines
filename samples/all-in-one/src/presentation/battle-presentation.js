export function createBattlePlayer({ scene, model }) {
  const shadow = scene.add.ellipse(113, 171, 105, 28, 0x020617, 0.55);
  const head = scene.add.circle(113, 129, 30, 0x60a5fa).setStrokeStyle(4, 0xdbeafe);
  const body = scene.add.rectangle(113, 171, 68, 64, 0x2563eb).setStrokeStyle(4, 0x93c5fd);
  const label = scene.add.text(0, 0, 'PLAYER', {
    fontFamily: 'monospace', fontSize: '17px', color: '#bfdbfe',
  });
  const hpBack = scene.add.rectangle(0, 34, 240, 18, 0x450a0a)
    .setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff);
  const hpFill = scene.add.rectangle(0, 34, 240, 14, 0x22c55e).setOrigin(0, 0.5);
  const hpText = scene.add.text(0, 48, '', {
    fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
  });
  const root = scene.add.container(42, 244, [shadow, head, body, label, hpBack, hpFill, hpText]);
  let wasAlive = model.hp > 0;

  const update = (player) => {
    const ratio = player.maxHp ? player.hp / player.maxHp : 0;
    hpFill.displayWidth = 240 * ratio;
    hpFill.setFillStyle(ratio > 0.35 ? 0x22c55e : 0xef4444);
    hpText.setText(`HP ${player.hp}/${player.maxHp}   ATK ${player.attack}   DEF ${player.defense}${player.guarding ? '   GUARDING' : ''}`);
    const alive = player.hp > 0;
    if (!alive) {
      if (!wasAlive) root.setVisible(false);
      wasAlive = false;
      return;
    }
    wasAlive = true;
    root.setVisible(true);
  };
  update(model);
  return { root, update };
}

export function createBattleEnemy({ scene, model }) {
  const { enemy, index } = model;
  const x = 690 + index * 145;
  const y = 105 + (index % 2) * 42;
  const color = enemy.color ?? 0xef4444;
  const shadow = scene.add.ellipse(0, 46, 120, 30, 0x020617, 0.5);
  const head = scene.add.circle(0, 12, 31, color).setStrokeStyle(4, 0xfef2f2);
  const body = scene.add.rectangle(0, 35, 76, 42, color).setStrokeStyle(3, 0xfecaca);
  const label = scene.add.text(-62, -44, enemy.label, {
    fontFamily: 'sans-serif', fontSize: '15px', color: '#ffffff',
  });
  const hpBack = scene.add.rectangle(-62, -20, 124, 12, 0x450a0a).setOrigin(0, 0.5);
  const hpFill = scene.add.rectangle(-62, -20, 124, 8, 0x4ade80).setOrigin(0, 0.5);
  const hpText = scene.add.text(66, -30, '', {
    fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
  });
  const root = scene.add.container(x, y, [shadow, head, body, label, hpBack, hpFill, hpText]);
  let wasAlive = enemy.hp > 0;

  const update = (nextEnemy) => {
    hpFill.displayWidth = 124 * (nextEnemy.hp / nextEnemy.maxHp);
    hpText.setText(`${nextEnemy.hp}/${nextEnemy.maxHp}`);
    const alive = nextEnemy.hp > 0;
    if (!alive) {
      if (!wasAlive) root.setVisible(false);
      wasAlive = false;
      return;
    }
    wasAlive = true;
    root.setVisible(true);
  };
  update(enemy);
  return { root, update };
}

export function deferBattleEffect(scene, { onImpact, onComplete }) {
  return scene.time.delayedCall(0, () => {
    onImpact();
    onComplete();
  });
}

export function createBattleField({ scene, model }) {
  let reducedMotion = model.settings?.reducedMotion ?? false;
  scene.cameras.main.setBackgroundColor('#172554');
  const background = scene.add.rectangle(480, 270, 960, 540, 0x172554);
  const enemyGround = scene.add.ellipse(760, 190, 360, 95, 0x334155, 0.65);
  const playerGround = scene.add.ellipse(155, 425, 250, 70, 0x0f172a, 0.7);
  const title = scene.add.text(24, 20, `Battle: ${model.label}`, {
    fontFamily: 'sans-serif', fontSize: '26px', color: '#ffffff',
  });
  const status = scene.add.text(320, 250, '', {
    fontFamily: 'monospace', fontSize: '17px', color: '#ddd6fe', lineSpacing: 7,
    wordWrap: { width: 610 },
  });
  const player = scene.createPrefab('battle.player', { model: model.state.game.player });
  const enemies = new Map(Object.values(model.state.game.enemies).map((enemy, index) => [
    enemy.id,
    scene.createPrefab('battle.enemy', { model: { enemy, index } }),
  ]));

  const getFighter = (id) => id === 'player' ? player : enemies.get(id);
  const phaseOut = (view, onComplete) => {
    scene.tweens.add({
      targets: view.root,
      alpha: 0,
      scaleX: 0.12,
      scaleY: 1.35,
      y: view.root.y - 18,
      duration: 360,
      ease: 'Sine.easeIn',
      onComplete: () => {
        view.root.setVisible(false);
        onComplete();
      },
    });
  };
  const flashDamage = (view, defeated, onComplete) => {
    scene.tweens.add({
      targets: view.root,
      alpha: 0.12,
      duration: 65,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        view.root.setAlpha(1);
        if (defeated) phaseOut(view, onComplete);
        else onComplete();
      },
    });
  };
  const playAttack = (effect, { onImpact, onComplete }) => {
    const attacker = getFighter(effect.actorId);
    const target = getFighter(effect.targetId);
    if (reducedMotion) {
      return deferBattleEffect(scene, { onImpact, onComplete });
    }
    if (!attacker?.root || !target?.root) {
      return deferBattleEffect(scene, { onImpact, onComplete });
    }
    const originX = attacker.root.x;
    const direction = effect.actorId === 'player' ? 1 : -1;
    scene.tweens.add({
      targets: attacker.root,
      x: originX - direction * 20,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => scene.tweens.add({
        targets: attacker.root,
        x: originX + direction * 72,
        duration: 110,
        ease: 'Quad.easeIn',
        onComplete: () => {
          onImpact();
          scene.cameras.main.shake(140, 0.006);
          flashDamage(target, effect.defeated, onComplete);
          scene.tweens.add({
            targets: attacker.root,
            x: originX,
            duration: 190,
            ease: 'Sine.easeOut',
          });
        },
      }),
    });
  };
  const playGuard = (effect, { onImpact, onComplete }) => {
    const defender = getFighter(effect.actorId);
    if (reducedMotion) {
      return deferBattleEffect(scene, { onImpact, onComplete });
    }
    if (!defender?.root) {
      return deferBattleEffect(scene, { onImpact, onComplete });
    }
    const playerDefending = effect.actorId === 'player';
    const center = playerDefending ? { x: 113, y: 145 } : { x: 0, y: 22 };
    const offsets = [
      [0, 0], [-34, 0], [34, 0], [-17, -29], [17, -29], [-17, 29], [17, 29],
    ];
    const radius = playerDefending ? 24 : 20;
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = (60 * index - 30) * (Math.PI / 180);
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    const hexagons = offsets.map(([x, y]) => {
      const hexagon = scene.add.polygon(center.x + x, center.y + y, points, 0x67e8f9, 0.18)
        .setStrokeStyle(3, 0xcffafe, 0.85)
        .setAlpha(0.08);
      defender.root.add(hexagon);
      return hexagon;
    });
    let completed = 0;
    onImpact();
    hexagons.forEach((hexagon, index) => scene.tweens.add({
      targets: hexagon,
      alpha: 0.78,
      duration: 135,
      delay: index * 55,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        completed += 1;
        if (completed !== hexagons.length) return;
        for (const item of hexagons) item.destroy();
        onComplete();
      },
    }));
  };
  const effects = {
    play(effect, callbacks) {
      if (effect.type === 'all-in-one.attack') playAttack(effect, callbacks);
      else if (effect.type === 'all-in-one.guard') playGuard(effect, callbacks);
      else deferBattleEffect(scene, callbacks);
    },
  };

  return {
    root: background,
    body: effects,
    update(next) {
      reducedMotion = next.settings?.reducedMotion ?? reducedMotion;
      title.setText(`Battle: ${next.label}`);
      status.setText(next.status);
      title.setScale(next.settings?.textScale ?? 1);
      status.setScale(next.settings?.textScale ?? 1);
      player.update(next.state.game.player);
      for (const [id, view] of enemies) view.update(next.state.game.enemies[id]);
    },
    destroy() {
      player.destroy();
      for (const view of enemies.values()) view.destroy();
      for (const object of [status, title, playerGround, enemyGround, background]) object.destroy();
    },
  };
}

export function createBattleResult({ scene, model }) {
  const border = model.tone === 'success' ? 0x4ade80 : 0xf87171;
  const titleColor = model.tone === 'success' ? '#86efac' : '#fca5a5';
  const panel = scene.add.rectangle(0, 0, 620, 250, 0x020617, 0.94).setStrokeStyle(4, border);
  const title = scene.add.text(0, -45, model.title, {
    fontFamily: 'sans-serif', fontSize: '38px', fontStyle: 'bold', color: titleColor,
  }).setOrigin(0.5);
  const message = scene.add.text(0, 22, model.message, {
    fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff',
  }).setOrigin(0.5);
  const status = scene.add.text(0, 66, model.status, {
    fontFamily: 'monospace', fontSize: '16px', color: '#94a3b8',
  }).setOrigin(0.5);
  return scene.add.container(480, 270, [panel, title, message, status]).setDepth(1000);
}

export function battleResultModel(outcome) {
  const won = outcome.kind === 'won';
  return {
    tone: won ? 'success' : 'failure',
    title: won ? 'BATTLE COMPLETE' : 'DEFEAT',
    message: won ? 'All enemies defeated' : 'Return with equipment, healing, and a plan',
    status: 'Returning to the world…',
  };
}
