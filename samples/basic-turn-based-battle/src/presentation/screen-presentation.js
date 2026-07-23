import {
  headingTextStyle,
  helpTextStyle,
} from './styles.js';

export function addHeading(scene, text) {
  return scene.add.text(480, 170, text, headingTextStyle).setOrigin(0.5);
}

export function addHelp(scene, text) {
  return scene.add.text(480, 270, text, helpTextStyle).setOrigin(0.5);
}
