import { describe, expect, it } from 'vitest';
import { BLOG_TOPICS, pickUncoveredTopic, seedTopicSlugs } from './topics.js';

describe('BLOG_TOPICS seed list', () => {
  it('has unique topic slugs (each slug is an idempotency key)', () => {
    const slugs = BLOG_TOPICS.map((t) => t.topic);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every topic a category and at least one keyword', () => {
    for (const t of BLOG_TOPICS) {
      expect(t.category.length).toBeGreaterThan(0);
      expect(t.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe('pickUncoveredTopic', () => {
  it('never returns an already-covered topic', () => {
    const first = BLOG_TOPICS[0].topic;
    const covered = new Set(BLOG_TOPICS.slice(1).map((t) => t.topic));
    // Only the first topic is open, so the (random) pick must return it.
    expect(pickUncoveredTopic(covered)?.topic).toBe(first);
  });

  it('returns null when every seed topic is covered', () => {
    expect(pickUncoveredTopic(seedTopicSlugs())).toBeNull();
  });

  it('resolves an override by substring match, ignoring coverage', () => {
    expect(
      pickUncoveredTopic(seedTopicSlugs(), 'ozempic-vs-wegovy')?.topic,
    ).toBe('ozempic-vs-wegovy');
  });

  it('returns null for an override that matches nothing', () => {
    expect(pickUncoveredTopic(new Set(), 'not-a-real-topic-slug')).toBeNull();
  });
});

describe('seedTopicSlugs', () => {
  it('covers exactly the fixed seed list', () => {
    const slugs = seedTopicSlugs();
    expect(slugs.size).toBe(BLOG_TOPICS.length);
    for (const t of BLOG_TOPICS) {
      expect(slugs.has(t.topic)).toBe(true);
    }
  });
});
