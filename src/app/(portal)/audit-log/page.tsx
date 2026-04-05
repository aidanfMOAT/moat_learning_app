import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import Link from 'next/link';

const EVENT_LABELS: Record<string, string> = {
  COURSE_STARTED: 'Course started',
  COURSE_COMPLETED: 'Course completed',
  QUIZ_PASSED: 'Quiz passed',
  QUIZ_FAILED: 'Quiz failed',
  ACK_SIGNED: 'Acknowledgement signed',
  QUIZ_ATTEMPTED: 'Quiz attempted'
};

const EVENT_BADGE: Record<string, string> = {
  COURSE_COMPLETED: 'badge-complete',
  QUIZ_PASSED: 'badge-complete',
  ACK_SIGNED: 'badge-complete',
  COURSE_STARTED: 'badge-progress',
  QUIZ_FAILED: 'badge-fail',
  QUIZ_ATTEMPTED: 'badge-progress'
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  }).format(d);
}

export default async function AuditLogPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === 'ADMIN';
  const isManager = session.user.role === 'MANAGER';

  if (!isAdmin && !isManager) {
    return <main className="card"><p>Access denied.</p></main>;
  }

  const where = isAdmin
    ? {}
    : { user: { teamId: session.user.teamId ?? undefined } };

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { include: { team: true } },
      course: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  });

  const completions = logs.filter((l) => l.event === 'COURSE_COMPLETED').length;
  const quizPasses = logs.filter((l) => l.event === 'QUIZ_PASSED').length;
  const acksSigned = logs.filter((l) => l.event === 'ACK_SIGNED').length;

  return (
    <main className="grid" style={{ gap: '1rem' }}>
      <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '.2rem' }}>Compliance Audit Log</h1>
          <p style={{ color: '#64748b', fontSize: '.9rem' }}>
            Full event history for regulatory and ESG compliance reporting.
          </p>
        </div>
        <Link
          href="/api/reports/audit-log"
          style={{ background: '#1d4ed8', color: '#fff', padding: '.45rem .9rem', borderRadius: '6px', fontSize: '.875rem', textDecoration: 'none' }}
        >
          Export CSV
        </Link>
      </section>

      <section className="grid grid-3">
        <article className="card">
          <h3>Course Completions</h3>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a' }}>{completions}</p>
        </article>
        <article className="card">
          <h3>Quiz Passes</h3>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1d4ed8' }}>{quizPasses}</p>
        </article>
        <article className="card">
          <h3>Acknowledgements</h3>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#7c3aed' }}>{acksSigned}</p>
        </article>
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date / Time (UTC)</th>
              <th>Learner</th>
              <th>Team</th>
              <th>Course</th>
              <th>Event</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              let detail = '';
              if (log.detail) {
                try {
                  const d = JSON.parse(log.detail);
                  if (d.score !== undefined) detail = `Score: ${d.score}% (pass mark ${d.passMark}%)`;
                  else detail = log.detail;
                } catch {
                  detail = log.detail;
                }
              }
              return (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '.82rem' }}>
                    {fmt(log.createdAt)}
                  </td>
                  <td>{log.user.name ?? log.user.email}</td>
                  <td>{log.user.team?.name ?? '—'}</td>
                  <td>{log.course?.title ?? '—'}</td>
                  <td>
                    <span className={`badge ${EVENT_BADGE[log.event] ?? ''}`}>
                      {EVENT_LABELS[log.event] ?? log.event}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '.85rem' }}>{detail || '—'}</td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: '#94a3b8', textAlign: 'center' }}>
                  No events recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
