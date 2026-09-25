export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'Studio endpoint active locally' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

// Automatic link cleaner: extracts pure URL even if HTML tag <img src="..."> was pasted
function cleanUrl(input: string): string {
  if (!input) return "";
  const match = input.match(/src=["']([^"']+)["']/);
  if (match) return match[1].trim();
  const urlMatch = input.match(/https?:\/\/[^\s"'>]+/);
  return urlMatch ? urlMatch[0].trim() : input.trim();
}

export const POST: APIRoute = async ({ request }) => {
  // PRODUCTION LOCKOUT: Blocks any request coming from the live internet!
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const rawText = await request.text();
    if (!rawText) {
      return new Response(JSON.stringify({ success: false, error: 'Empty payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = JSON.parse(rawText);

    // Use slug or fallback to English title (or Slovak title)
    const slug = data.slug || (data.title_en || data.title_sk || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filePath = path.join(process.cwd(), 'src', 'content', 'projects', `${slug}.mdx`);

    const skillsArray = data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const collabsArray = data.collaborators ? data.collaborators.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
    const gearArray = data.gearList ? data.gearList.split(',').map((g: string) => g.trim()).filter(Boolean) : [];
    const galleryArray = data.galleryText ? data.galleryText.split('\n').map((url: string) => cleanUrl(url)).filter(Boolean) : [];

    // Structured Awards Array from the new Card Builder
    const awardsArray = Array.isArray(data.awards) 
      ? data.awards.filter((a: any) => a.festival && (a.award_en || a.award_sk))
      : [];

    // Parse multiline BTS: MediaURL | Note (EN) | Note (SK) | Gear
    const btsArray = data.btsText
      ? data.btsText.split('\n').map((line: string) => {
          const parts = line.split('|').map((p: string) => p.trim());
          if (parts.length >= 3) {
            return {
              media: cleanUrl(parts[0]),
              note_en: parts[1],
              note_sk: parts[2],
              gear: parts[3] || undefined,
            };
          }
          return null;
        }).filter(Boolean)
      : [];

    const mdxContent = `---
title_en: "${data.title_en}"
title_sk: "${data.title_sk}"
title: "${data.title_en}"
date: "${data.date || '2026'}"
duration: "${data.duration || ''}"
place: "${data.place || 'Košice, Slovakia'}"
venue: "${data.venue || ''}"
client: "${data.client || ''}"
collaborators:
${collabsArray.map((c: string) => `  - "${c}"`).join('\n') || '  - "Bogdan Perederii"'}
skills:
${skillsArray.map((s: string) => `  - "${s}"`).join('\n') || '  - "Cinematography"'}
tagline_en: "${data.tagline_en || ''}"
tagline_sk: "${data.tagline_sk || ''}"
story_en: |
  ${(data.story_en || '').replace(/\n/g, '\n  ')}
story_sk: |
  ${(data.story_sk || '').replace(/\n/g, '\n  ')}
coverImage: "${cleanUrl(data.coverImage) || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800'}"

blockOrder: [${(data.blockOrder || ['hero', 'story', 'awards', 'teaser', 'gallery', 'bts']).map((b: string) => `'${b}'`).join(', ')}]

heroMedia:
  type: "${data.heroType || 'video'}"
  url: "${cleanUrl(data.heroUrl) || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}"

${data.teaserUrl ? `teaserVideo:
  title_en: "${data.teaserTitle_en || 'Official Festival Screening Teaser'}"
  title_sk: "${data.teaserTitle_sk || 'Oficiálny festivalový teaser'}"
  url: "${cleanUrl(data.teaserUrl)}"
  caption_en: "${data.teaserCaption_en || ''}"
  caption_sk: "${data.teaserCaption_sk || ''}"` : ''}

# POISTKY: Ak je pole prázdne, zapíše sa [] namiesto prázdneho riadku
gearList: ${gearArray.length > 0 ? '\n' + gearArray.map((g: string) => `  - "${g}"`).join('\n') : '[]'}

gallery: ${galleryArray.length > 0 ? '\n' + galleryArray.map((url: string) => `  - "${url}"`).join('\n') : '[]'}

awards: ${awardsArray.length > 0 ? '\n' + awardsArray.map((a: any) => `  - festival: "${a.festival}"
    award_en: "${a.award_en}"
    award_sk: "${a.award_sk}"
    year: "${a.year}"
    ${a.laurelImage ? `laurelImage: "${cleanUrl(a.laurelImage)}"` : ''}`).join('\n') : '[]'}

bts: ${btsArray.length > 0 ? '\n' + btsArray.map((b: any) => `  - media: "${b.media}"
    note_en: "${b.note_en}"
    note_sk: "${b.note_sk}"
    ${b.gear ? `gear: "${b.gear}"` : ''}`).join('\n') : '[]'}
---
`;

    fs.writeFileSync(filePath, mdxContent, 'utf-8');

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};