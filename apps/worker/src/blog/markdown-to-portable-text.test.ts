import { describe, expect, it } from 'vitest';
import { markdownToPortableText } from './markdown-to-portable-text.js';

describe('markdownToPortableText', () => {
  it('converts headings to styled blocks', () => {
    const blocks = markdownToPortableText('# Title\n## Section\n### Sub');
    expect(blocks.map((b) => b.style)).toEqual(['h1', 'h2', 'h3']);
    expect(blocks[0].children?.[0].text).toBe('Title');
  });

  it('skips blank lines and horizontal rules', () => {
    const blocks = markdownToPortableText('One\n\n---\n\nTwo');
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.children?.[0].text)).toEqual(['One', 'Two']);
  });

  it('converts bullet and numbered lists', () => {
    const blocks = markdownToPortableText('- a\n* b\n1. c');
    expect(blocks[0].listItem).toBe('bullet');
    expect(blocks[1].listItem).toBe('bullet');
    expect(blocks[2].listItem).toBe('number');
    expect(blocks[2].children?.[0].text).toBe('c');
  });

  it('parses bold and italic inline marks', () => {
    const [block] = markdownToPortableText('plain **bold** and *ital*');
    const spans = block.children ?? [];
    expect(spans.map((s) => s.text)).toEqual([
      'plain ',
      'bold',
      ' and ',
      'ital',
    ]);
    expect(spans[1].marks).toEqual(['strong']);
    expect(spans[3].marks).toEqual(['em']);
  });

  it('turns markdown links into link markDefs referenced by the span', () => {
    const [block] = markdownToPortableText('[Titrra](https://titrra.com)');
    const def = block.markDefs?.[0];
    expect(def?._type).toBe('link');
    expect(def?.href).toBe('https://titrra.com');
    expect(block.children?.[0].marks).toEqual([def?._key]);
  });

  it('renders blockquotes with the blockquote style', () => {
    const [block] = markdownToPortableText('> calm words');
    expect(block.style).toBe('blockquote');
    expect(block.children?.[0].text).toBe('calm words');
  });
});
