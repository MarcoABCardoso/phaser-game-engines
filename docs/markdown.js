import { marked, Renderer } from 'marked';

const renderer = new Renderer();
renderer.html = ({ text }) => escapeHtml(text);
renderer.link = function ({ href, title, tokens }) {
  const label = this.parser.parseInline(tokens);
  const safeHref = sanitizeUrl(href);
  if (!safeHref) return label;
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(safeHref)}"${titleAttribute}>${label}</a>`;
};
renderer.image = ({ href, title, text }) => {
  const safeHref = sanitizeUrl(href);
  if (!safeHref) return escapeHtml(text);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
  return `<img src="${escapeHtml(safeHref)}" alt="${escapeHtml(text)}"${titleAttribute}>`;
};

export function renderMarkdown(source) {
  return marked.parse(source, {
    gfm: true,
    renderer,
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeUrl(value) {
  const protocol = value.trim().replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  return /^(?:javascript|vbscript|data):/.test(protocol) ? null : value;
}
