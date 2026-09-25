import { getCollection } from 'astro:content';

export async function GET() {
  const projects = await getCollection('projects');
  return new Response(JSON.stringify(projects, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}