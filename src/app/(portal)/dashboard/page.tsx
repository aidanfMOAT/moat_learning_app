import Link from 'next/link';
import { AssignmentScope, ProgressStatus, QuizRequirement, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await requireSession();

  const assignedCourses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      assignments: {
        some: {
          OR: [
            { scope: AssignmentScope.EVERYONE },
            { scope: AssignmentScope.USER, userId: session.user.id },
            session.user.teamId ? { scope: AssignmentScope.TEAM, teamId: session.user.teamId } : undefined
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
    inProgress: assignedCourses.filter((c) => c.progress[0]?.status === ProgressStatus.IN_PROGRESS).length,
    completed: assignedCourses.filter((c) => c.progress[0]?.status === ProgressStatus.COMPLETED).length
  };

  const isManager = session.user.role === Role.MANAGER;
  const isAdmin = session.user.role === Role.ADMIN;

  const teamReport =
    isManager && session.user.teamId
      ? await prisma.courseProgress.findMany({
          where: { user: { teamId: session.user.teamId } },
          include: { user: true, course: true }
        })
      : [];

  const adminReport =
    isAdmin
      ? await prisma.course.findMany({
          include: {
            progress: true,
            assignments: true,
            quizAttempts: true
          }
        })
      : [];

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
            {assignedCourses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.progress[0]?.status ?? 'NOT_STARTED'}</td>
                <td>{course.quizRequirement}</td>
                <td><Link href={`/courses/${course.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isManager ? (
        <section className="card">
          <h2>Manager Team Report</h2>
          <p>Team completion %: {teamReport.length ? Math.round((teamReport.filter((p) => p.status === ProgressStatus.COMPLETED).length / teamReport.length) * 100) : 0}%</p>
          <ul>
            {teamReport
              .filter((p) => p.status !== ProgressStatus.COMPLETED || p.latestQuizScore === null)
              .map((p) => (
                <li key={p.id}>{p.user.name} · {p.course.title} · {p.status} · latest quiz: {p.latestQuizScore ?? 'Not attempted'}</li>
              ))}
          </ul>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="card">
          <h2>Admin Snapshot</h2>
          <Link href="/api/reports/export">Export CSV</Link>
          <ul>
            {adminReport.map((course) => {
              const attempts = course.quizAttempts.length;
              const passRate = attempts
                ? Math.round((course.quizAttempts.filter((a) => a.passed).length / attempts) * 100)
                : 0;
              return (
                <li key={course.id}>{course.title}: completions {course.progress.filter((p) => p.status === 'COMPLETED').length} · quiz pass rate {passRate}% · mode {course.quizRequirement === QuizRequirement.OFF ? 'No quiz' : course.quizRequirement}</li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
