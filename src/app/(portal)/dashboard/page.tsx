import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

function statusLabel(s: string) {
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'IN_PROGRESS') return 'In Progress';
  return 'Not Started';
}

function statusBadgeClass(s: string) {
  if (s === 'COMPLETED') return 'badge-complete';
  if (s === 'IN_PROGRESS') return 'badge-progress';
  return 'badge-notstarted';
}

export default async function DashboardPage() {
  const session = await requireSession();

  const assignedCourses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      assignments: {
        some: {
          OR: [
            { scope: 'EVERYONE' },
            { scope: 'USER', userId: session.user.id },
            session.user.teamId ? { scope: 'TEAM', teamId: session.user.teamId } : undefined
          ].filter(Boolean) as any
        }
      }
    },
    include: {
      progress: { where: { userId: session.user.id } },
      quizAttempts: { where: { userId: session.user.id } }
    }
  });

  const learnerCards = {
    assigned: assignedCourses.length,
    inProgress: assignedCourses.filter((c) => c.progress[0]?.status === 'IN_PROGRESS').length,
    completed: assignedCourses.filter((c) => c.progress[0]?.status === 'COMPLETED').length
  };

  const isManager = session.user.role === 'MANAGER';
  const isAdmin = session.user.role === 'ADMIN';

  const teamReport =
    isManager && session.user.teamId
      ? await prisma.courseProgress.findMany({
          where: { user: { teamId: session.user.teamId } },
          include: { user: true, course: true },
          orderBy: [{ user: { name: 'asc' } }, { course: { title: 'asc' } }]
        })
      : [];

  const adminReport =
    isAdmin
      ? await prisma.course.findMany({
          where: { status: 'PUBLISHED' },
          include: { progress: true, assignments: true, quizAttempts: true },
          orderBy: { title: 'asc' }
        })
      : [];

  const learnerSummary =
    isAdmin
      ? await prisma.user.findMany({
          where: { role: 'LEARNER' },
          include: { progress: true, team: true },
          orderBy: { name: 'asc' }
        })
      : [];

  const teamCompletionPct = teamReport.length
    ? Math.round((teamReport.filter((p) => p.status === 'COMPLETED').length / teamReport.length) * 100)
    : 0;

  const atRiskCount = teamReport.filter((p) => p.status !== 'COMPLETED').length;

  return (
    <main className="grid" style={{ gap: '1rem' }}>
      <section className="card">
        <h1>Dashboard</h1>
        <p>Welcome back, {session.user.name ?? session.user.email}.</p>
      </section>

      <section className="grid grid-3">
        <article className="card"><h3>Assigned</h3><p>{learnerCards.assigned}</p></article>
        <article className="card"><h3>In Progress</h3><p>{learnerCards.inProgress}</p></article>
        <article className="card"><h3>Completed</h3><p>{learnerCards.completed}</p></article>
      </section>

      <section className="card">
        <h2>My Learning</h2>
        <table className="table">
          <thead><tr><th>Course</th><th>Status</th><th>Quiz</th><th /></tr></thead>
          <tbody>
            {assignedCourses.map((course) => {
              const status = course.progress[0]?.status ?? 'NOT_STARTED';
              return (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td><span className={`badge ${statusBadgeClass(status)}`}>{statusLabel(status)}</span></td>
                  <td>{course.quizRequirement === 'OFF' ? 'No quiz' : course.quizRequirement === 'REQUIRED' ? 'Required' : 'Optional'}</td>
                  <td><Link href={`/courses/${course.id}`}>Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {isManager && (
        <section className="card">
          <h2>Team Report</h2>
          <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
            <article className="card"><h3>Completion Rate</h3><p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>{teamCompletionPct}%</p></article>
            <article className="card"><h3>Total Enrolments</h3><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{teamReport.length}</p></article>
            <article className="card"><h3>Incomplete</h3><p style={{ fontSize: '1.5rem', fontWeight: 700, color: atRiskCount > 0 ? '#f59e0b' : '#22c55e' }}>{atRiskCount}</p></article>
          </div>
          <table className="table">
            <thead>
              <tr><th>Learner</th><th>Course</th><th>Status</th><th>Best Score</th><th>Last Active</th></tr>
            </thead>
            <tbody>
              {teamReport.map((p) => (
                <tr key={p.id}>
                  <td>{p.user.name ?? p.user.email}</td>
                  <td>{p.course.title}</td>
                  <td><span className={`badge ${statusBadgeClass(p.status)}`}>{statusLabel(p.status)}</span></td>
                  <td>{p.bestQuizScore !== null ? `${p.bestQuizScore}%` : '—'}</td>
                  <td>{p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
              ))}
              {teamReport.length === 0 && (
                <tr><td colSpan={5} style={{ color: '#94a3b8', textAlign: 'center' }}>No activity yet</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {isAdmin && (
        <section className="card">
          <h2>Admin Snapshot</h2>
          <div style={{ marginBottom: '1rem' }}>
            <Link href="/api/reports/export" style={{ color: '#1d4ed8', fontSize: '.9rem' }}>⬇ Export CSV</Link>
          </div>

          <h3 style={{ marginBottom: '.5rem' }}>Courses</h3>
          <table className="table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr><th>Course</th><th>Quiz</th><th>Completions</th><th>Pass Rate</th></tr>
            </thead>
            <tbody>
              {adminReport.map((course) => {
                const attempts = course.quizAttempts.length;
                const passRate = attempts
                  ? Math.round((course.quizAttempts.filter((a) => a.passed).length / attempts) * 100)
                  : null;
                const completions = course.progress.filter((p) => p.status === 'COMPLETED').length;
                return (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.quizRequirement === 'OFF' ? 'No quiz' : course.quizRequirement === 'REQUIRED' ? 'Required' : 'Optional'}</td>
                    <td>{completions}</td>
                    <td>{passRate !== null ? `${passRate}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3 style={{ marginBottom: '.5rem' }}>Learner Activity</h3>
          <table className="table">
            <thead>
              <tr><th>Learner</th><th>Team</th><th>Assigned</th><th>Completed</th><th>In Progress</th></tr>
            </thead>
            <tbody>
              {learnerSummary.map((u) => {
                const completed = u.progress.filter((p) => p.status === 'COMPLETED').length;
                const inProgress = u.progress.filter((p) => p.status === 'IN_PROGRESS').length;
                return (
                  <tr key={u.id}>
                    <td>{u.name ?? u.email}</td>
                    <td>{u.team?.name ?? '—'}</td>
                    <td>{u.progress.length}</td>
                    <td><span className="badge badge-complete">{completed}</span></td>
                    <td>{inProgress > 0 ? <span className="badge badge-progress">{inProgress}</span> : '—'}</td>
                  </tr>
                );
              })}
              {learnerSummary.length === 0 && (
                <tr><td colSpan={5} style={{ color: '#94a3b8', textAlign: 'center' }}>No learners yet</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
