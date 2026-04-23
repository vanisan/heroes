import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const iconsPath = path.join(process.cwd(), 'public', 'icons');
  try {
    const files = fs.readdirSync(iconsPath);
    return NextResponse.json({ exists: true, files });
  } catch (error: any) {
    return NextResponse.json({ exists: false, error: error.message, path: iconsPath }, { status: 500 });
  }
}
