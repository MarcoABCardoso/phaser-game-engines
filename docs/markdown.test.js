import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('documentation Markdown rendering', () => {
  it('renders the structures used by public guides', () => {
    const rendered = renderMarkdown(`# Guide

- one
- two

| API | Purpose |
| --- | --- |
| \`headless\` | Tests |

\`\`\`js
const ready = true;
\`\`\`
`);

    expect(rendered).toContain('<h1>Guide</h1>');
    expect(rendered).toContain('<ul>');
    expect(rendered).toContain('<table>');
    expect(rendered).toContain('<code class="language-js">');
  });

  it('does not execute raw HTML from a Markdown document', () => {
    const rendered = renderMarkdown(`<script>alert("no")</script>

[unsafe](javascript:alert("no"))
`);

    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).not.toContain('javascript:');
    expect(rendered).toContain('<p>unsafe</p>');
  });
});
