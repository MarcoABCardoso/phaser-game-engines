import choosing from './CHOOSING_A_PACKAGE.md?raw';
import publicApi from './PUBLIC_API.md?raw';
import recipes from './RECIPES.md?raw';
import tools from './DEVELOPER_TOOLS.md?raw';
import semver from './VERSIONING.md?raw';
import platformer from './tutorials/platformer.md?raw';
import topDown from './tutorials/top-down.md?raw';
import battle from './tutorials/battle.md?raw';
import manifest from '../package.json';

const pages = { 'Choosing a package': choosing, 'Public API': publicApi, Recipes: recipes, 'Developer tools': tools, Versioning: semver, 'Platformer tutorial': platformer, 'Top-down tutorial': topDown, 'Battle tutorial': battle };
const navigation = document.querySelector('#navigation');
const search = document.querySelector('#search');
const title = document.querySelector('#title');
const content = document.querySelector('#content');
document.querySelector('#version').textContent = `v${manifest.version}`;
document.querySelector('#docs-version').textContent = `v${manifest.version}`;
let selected = Object.keys(pages)[0];

function render() {
  const query = search.value.trim().toLowerCase();
  navigation.replaceChildren(...Object.entries(pages).filter(([name, text]) => !query || `${name} ${text}`.toLowerCase().includes(query)).map(([name]) => {
    const button = document.createElement('button');
    button.textContent = name;
    button.setAttribute('aria-pressed', String(name === selected));
    button.onclick = () => { selected = name; render(); };
    return button;
  }));
  title.textContent = selected;
  content.textContent = pages[selected];
}
search.addEventListener('input', render);
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy'; }, 1500);
  });
}
render();
