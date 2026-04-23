import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await props.params;
  const filePath = path.join(process.cwd(), 'public', 'game-assets', ...pathSegments);
  
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  
  const contentTypes: Record<string, string> = {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
