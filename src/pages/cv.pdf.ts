import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async () => {
  const cvDir = path.join(process.cwd(), 'src', 'cv');

  // Check if folder exists
  if (!fs.existsSync(cvDir)) {
    return new Response('Folder src/cv/ does not exist. Please create it and add your PDF.', { status: 404 });
  }

  // Find all PDF files in src/cv/
  const pdfFiles = fs.readdirSync(cvDir).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    return new Response('No PDF file found in src/cv/. Drop your CV PDF there.', { status: 404 });
  }

  // Automatically find the newest PDF by modification date
  const latestPdf = pdfFiles
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(cvDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time)[0].name;

  // Read and serve the file
  const filePath = path.join(cvDir, latestPdf);
  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="CV_Bogdan_Perederii.pdf"',
    },
  });
};