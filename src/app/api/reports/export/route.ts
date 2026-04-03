import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function GET() {
  await requireRole(['ADMIN']);

  const rows = await prisma.courseProgress.findMany({
    include: { user: { include: { team: true } }, course: true }
  });

  const header = ['user_name', 'user_email', 'team', 'course', 'status', 'completion_date', 'best_quiz_score', 'latest_quiz_score', 'attempt_count'];
  const body = rows.map((r) => [
    r.user.name ?? '',
    r.user.email ?? '',
    r.user.team?.name ?? '',
    r.course.title,
    r.status,
    r.completionDate?.toISOString() ?? '',
    r.bestQuizScore ?? '',
    r.latestQuizScore ?? '',
    r.quizAttemptCount
  ]);

  const csv = [header, ...body].map((line) => line.join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="admin_report.csv"'
    }
  });
}
