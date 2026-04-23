import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const iconsPath = path.join(process.cwd(), 'public', 'icons');
  try {
    const files = fs.readdirSync(iconsPath);
    const testFile = files.find(f => f.endsWith('.webp'));
    let readable = false;
    if (testFile) {
      const fd = fs.openSync(path.join(iconsPath, testFile), 'r');
      fs.closeSync(fd);
      readable = true;
    }
    return NextResponse.json({ exists: true, readable, files, cwd: process.cwd() });
  } catch (error: any) {
    return NextResponse.json({ exists: false, error: error.message, path: iconsPath }, { status: 500 });
  }
}
