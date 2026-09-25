import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    // Resilient Titles (Accepts title_en, title_sk, OR standard title)
    title: z.string().optional(),
    title_en: z.string().optional(),
    title_sk: z.string().optional(),

    date: z.string().default('2026'),
    duration: z.string().optional(),
    place: z.string().default('Košice, Slovakia'),
    venue: z.string().optional(),
    client: z.string().optional(),
    collaborators: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),

    tagline_en: z.string().default(''),
    tagline_sk: z.string().default(''),

    story_en: z.string().optional(),
    story_sk: z.string().optional(),

    coverImage: z.string().default('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800'),
    blockOrder: z.array(z.string()).default(['hero', 'story', 'awards', 'teaser', 'gallery', 'bts']),

    heroMedia: z.object({
      type: z.enum(['video', 'photo']).default('video'),
      url: z.string(),
    }).optional(),

    teaserVideo: z.object({
      title_en: z.string().optional(),
      title_sk: z.string().optional(),
      title: z.string().optional(),
      url: z.string(),
      caption_en: z.string().optional(),
      caption_sk: z.string().optional(),
      caption: z.string().optional(),
    }).optional(),

    gearList: z.array(z.string()).default([]),
    gallery: z.array(z.string()).default([]),

    // Resilient Awards (Accepts award_en, award_sk, OR standard award)
    awards: z.array(z.object({
      festival: z.string(),
      award_en: z.string().optional(),
      award_sk: z.string().optional(),
      award: z.string().optional(),
      year: z.union([z.string(), z.number()]),
      laurelImage: z.string().optional(),
    })).default([]),

    // Resilient BTS (Accepts note_en, note_sk, OR standard note)
    bts: z.array(z.object({
      media: z.string(),
      note_en: z.string().optional(),
      note_sk: z.string().optional(),
      note: z.string().optional(),
      gear: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { projects };