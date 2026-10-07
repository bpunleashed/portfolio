import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import fs from 'node:fs';
import path from 'node:path';

// Pomocná funkcia na vyčistenie URL z vložených HTML tagov
function cleanUrl(input) {
  if (!input) return "";
  const match = input.match(/src=["']([^"']+)["']/);
  if (match) return match[1].trim();
  const urlMatch = input.match(/https?:\/\/[^\s"'>]+/);
  return urlMatch ? urlMatch[0].trim() : input.trim();
}

// Lokálny CMS plugin, ktorý beží IBA na tvojom laptope pri 'npm run dev'
function localCmsPlugin() {
  return {
    name: 'local-cms-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url && req.url.includes('/api/create-project')) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const slug = data.slug || (data.title_en || data.title_sk || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const filePath = path.join(process.cwd(), 'src', 'content', 'projects', `${slug}.mdx`);

              const skillsArray = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
              const collabsArray = data.collaborators ? data.collaborators.split(',').map(c => c.trim()).filter(Boolean) : [];
              const gearArray = data.gearList ? data.gearList.split(',').map(g => g.trim()).filter(Boolean) : [];
              const galleryArray = data.galleryText ? data.galleryText.split('\n').map(url => cleanUrl(url)).filter(Boolean) : [];
              const awardsArray = Array.isArray(data.awards) ? data.awards.filter(a => a.festival && (a.award_en || a.award_sk)) : [];
              const btsArray = data.btsText ? data.btsText.split('\n').map(line => {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 3) {
                  return { media: cleanUrl(parts[0]), note_en: parts[1], note_sk: parts[2], gear: parts[3] || undefined };
                }
                return null;
              }).filter(Boolean) : [];

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
${collabsArray.map(c => `  - "${c}"`).join('\n') || '  - "Bogdan Perederii"'}
skills:
${skillsArray.map(s => `  - "${s}"`).join('\n') || '  - "Cinematography"'}
tagline_en: "${data.tagline_en || ''}"
tagline_sk: "${data.tagline_sk || ''}"
story_en: |
  ${(data.story_en || '').replace(/\n/g, '\n  ')}
story_sk: |
  ${(data.story_sk || '').replace(/\n/g, '\n  ')}
coverImage: "${cleanUrl(data.coverImage) || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800'}"

blockOrder: [${(data.blockOrder || ['hero', 'story', 'awards', 'teaser', 'gallery', 'bts']).map(b => `'${b}'`).join(', ')}]

heroMedia:
  type: "${data.heroType || 'video'}"
  url: "${cleanUrl(data.heroUrl) || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}"

${data.teaserUrl ? `teaserVideo:
  title_en: "${data.teaserTitle_en || 'Official Festival Screening Teaser'}"
  title_sk: "${data.teaserTitle_sk || 'Oficiálny festivalový teaser'}"
  url: "${cleanUrl(data.teaserUrl)}"
  caption_en: "${data.teaserCaption_en || ''}"
  caption_sk: "${data.teaserCaption_sk || ''}"` : ''}

gearList: ${gearArray.length > 0 ? '\n' + gearArray.map(g => `  - "${g}"`).join('\n') : '[]'}
gallery: ${galleryArray.length > 0 ? '\n' + galleryArray.map(url => `  - "${url}"`).join('\n') : '[]'}
awards: ${awardsArray.length > 0 ? '\n' + awardsArray.map(a => `  - festival: "${a.festival}"\n    award_en: "${a.award_en}"\n    award_sk: "${a.award_sk}"\n    year: "${a.year}"\n    ${a.laurelImage ? `laurelImage: "${cleanUrl(a.laurelImage)}"` : ''}`).join('\n') : '[]'}
bts: ${btsArray.length > 0 ? '\n' + btsArray.map(b => `  - media: "${b.media}"\n    note_en: "${b.note_en}"\n    note_sk: "${b.note_sk}"\n    ${b.gear ? `gear: "${b.gear}"` : ''}`).join('\n') : '[]'}
---
`;

              fs.writeFileSync(filePath, mdxContent, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, slug }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  site: 'https://bpunleashed.github.io',
  base: '/portfolio',
  build: {
    assets: 'assets'
  },
  vite: {
    plugins: [tailwindcss(), localCmsPlugin()]
  },
  integrations: [mdx()]
});