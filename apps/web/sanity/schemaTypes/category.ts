import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    defineField({
      name: 'color',
      type: 'string',
      // Mirrors the OG_COLORS brand tokens.
      options: { list: ['teal', 'tealDeep', 'sand', 'ink', 'accent'] },
      initialValue: 'teal',
    }),
  ],
});
