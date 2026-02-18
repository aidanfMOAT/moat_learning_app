import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function POST(req: Request) {
  await requireRole([Role.ADMIN]);
  const formData = await req.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const role = String(formData.get('role')) as Role;
  const name = String(formData.get('name'));
  const teamId = String(formData.get('teamId') || '') || null;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, passwordHash, role, name, teamId }
  });

  return NextResponse.redirect(new URL('/admin', req.url));
}
