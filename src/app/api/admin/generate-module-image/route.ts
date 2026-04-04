import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { requireRole } from '@/lib/session';

export async function POST(req: Request) {
  await requireRole(['ADMIN']);

  const { moduleId } = await req.json();
  if (!moduleId) return NextResponse.json({ error: 'moduleId required' }, { status: 400 });

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

  if (module.imageUrl) return NextResponse.json({ imageUrl: module.imageUrl });

  const prompt = `A clean, professional, modern illustration for a corporate learning module titled "${module.title}". Abstract, minimal, no text, suitable for a business training slide. Flat design style, soft colours.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1792x1024',
    quality: 'standard',
    n: 1
  });

  const imageUrl = response.data[0].url;
  if (!imageUrl) return NextResponse.json({ error: 'No image returned' }, { status: 500 });

  // Download and save locally
  const imageRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const dir = path.join(process.cwd(), 'public', 'generated');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${moduleId}.png`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  const localPath = `/generated/${filename}`;
  await prisma.module.update({ where: { id: moduleId }, data: { imageUrl: localPath } });

  return NextResponse.json({ imageUrl: localPath });
}
