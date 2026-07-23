import choosing from './CHOOSING_A_PACKAGE.md?raw';
import publicApi from './PUBLIC_API.md?raw';
import recipes from './RECIPES.md?raw';
import tools from './DEVELOPER_TOOLS.md?raw';
import semver from './VERSIONING.md?raw';
import platformer from './tutorials/platformer.md?raw';
import topDown from './tutorials/top-down.md?raw';
import battle from './tutorials/battle.md?raw';
import allInOne from './ALL_IN_ONE_SLICE.md?raw';
import manifest from '../package.json';
import { renderMarkdown } from './markdown.js';

const pages = [
  { title: 'Choosing a package', slug: 'choosing-a-package', markdown: choosing },
  { title: 'All-in-one RPG slice', slug: 'all-in-one-rpg-slice', markdown: allInOne },
  { title: 'Public API', slug: 'public-api', markdown: publicApi },
  { title: 'Recipes', slug: 'recipes', markdown: recipes },
  { title: 'Developer tools', slug: 'developer-tools', markdown: tools },
  { title: 'Versioning', slug: 'versioning', markdown: semver },
  { title: 'Platformer tutorial', slug: 'platformer-tutorial', markdown: platformer },
  { title: 'Top-down tutorial', slug: 'top-down-tutorial', markdown: topDown },
  { title: 'Battle tutorial', slug: 'battle-tutorial', markdown: battle },
];
const navigation = document.querySelector('#navigation');
const search = document.querySelector('#search');
const content = document.querySelector('#content');
const outline = document.querySelector('#outline');
const results = document.querySelector('#search-results');
document.querySelector('#version').textContent = `v${manifest.version}`;
document.querySelector('#docs-version').textContent = `v${manifest.version}`;
const [initialPage, initialSection] = location.hash.slice(1).split('/');
let selected = pages.find(page => page.slug === initialPage) ?? pages[0];

function render() {
  const query = search.value.trim().toLowerCase();
  const matches = pages.filter(page => !query || `${page.title} ${page.markdown}`.toLowerCase().includes(query));
  navigation.replaceChildren(...matches.map(page => {
    const button = document.createElement('button');
    button.textContent = page.title;
    button.setAttribute('aria-pressed', String(page === selected));
    button.onclick = () => selectPage(page);
    return button;
  }));
  results.textContent = query ? `${matches.length} ${matches.length === 1 ? 'guide' : 'guides'} found` : '';
  renderDocument();
}

function selectPage(page) {
  selected = page;
  history.replaceState(null, '', `#${page.slug}`);
  render();
  content.focus({ preventScroll: true });
}

function renderDocument() {
  content.innerHTML = renderMarkdown(selected.markdown);
  content.setAttribute('aria-label', selected.title);

  const usedIds = new Map();
  const headings = [...content.querySelectorAll('h2, h3')];
  for (const heading of headings) {
    const base = slugify(heading.textContent) || 'section';
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    heading.id = count ? `${base}-${count + 1}` : base;
  }

  for (const link of content.querySelectorAll('a[href]')) {
    if (/^https?:\/\//i.test(link.getAttribute('href'))) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
  }

  outline.replaceChildren(...headings.map(heading => {
    const link = document.createElement('a');
    link.href = `#${selected.slug}/${heading.id}`;
    link.textContent = heading.textContent;
    link.className = heading.tagName === 'H3' ? 'outline-nested' : '';
    link.onclick = event => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', link.href);
    };
    return link;
  }));
  outline.hidden = headings.length === 0;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
if (initialSection) {
  requestAnimationFrame(() => document.getElementById(initialSection)?.scrollIntoView());
}
