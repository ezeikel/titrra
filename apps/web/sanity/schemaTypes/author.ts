import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    // e.g. "GLP-1 educator" — a role, never a medical claim/credential.
    defineField({ name: 'title', title: 'Role', type: 'string' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio', type: 'text', rows: 3 }),
  ],
});
