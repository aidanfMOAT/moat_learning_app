import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export async function GET() {
  const session = await requireSession();
  const isAdmin = session.user.role === 'ADMIN';
  const isManager = session.user.role === 'MANAGER';

  if (!isAdmin && !isManager) {
    return new Response('Forbidden', { status: 403 });
  }

  const where = isAdmin
    ? {}
    : { user: { teamId: session.user.teamId ?? undefined } };

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { include: { team: true } },
      course: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const header = ['timestamp_utc', 'learner_name', 'learner_email', 'team', 'course', 'event', 'detail'];
  const body = logs.map((l) => [
    l.createdAt.toISOString(),
    l.user.name ?? '',
    l.user.email ?? '',
    l.user.team?.name ?? '',
    l.course?.title ?? '',
    l.event,
    l.detail ?? ''
  ]);

  const csv = [header, ...body]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit_log_${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
