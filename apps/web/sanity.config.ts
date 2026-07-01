'use client';

import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { apiVersion, dataset, projectId } from '@/lib/sanity/client';
import { schemaTypes } from '@/sanity/schemaTypes';

export default defineConfig({
  name: 'titrra-blog',
  title: 'Titrra Blog',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
