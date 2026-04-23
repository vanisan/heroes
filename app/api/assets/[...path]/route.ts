import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await props.params;
  const fileName = pathSegments[pathSegments.length - 1];
  const subFolder = pathSegments.slice(0, -1);
  
  // Попробуем несколько вариантов пути
  const searchDirs = [
    path.join(process.cwd(), 'public', 'icons', ...subFolder),
    path.join(process.cwd(), 'icons', ...subFolder),
    path.join(process.cwd(), '.next', 'server', 'public', 'icons', ...subFolder), // Костыль для некоторых версий Next на Vercel
  ];

  let filePath = '';
  let found = false;

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      // Ищем файл без учета регистра
      const match = files.find(f => f.toLowerCase() === fileName.toLowerCase());
      if (match) {
        filePath = path.join(dir, match);
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    console.error('[API-ASSETS] Not found:', pathSegments.join('/'));
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
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
        'X-Asset-Path-Found': filePath
      },
    });
  } catch (err: any) {
    return new NextResponse('Error reading file', { status: 500 });
  }
}
