import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export default async function AdminPage() {
  await requireRole([Role.ADMIN]);
  const users = await prisma.user.findMany({ include: { team: true }, orderBy: { createdAt: 'asc' } });
  const teams = await prisma.team.findMany();
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      modules: { orderBy: { order: 'asc' } },
      quizQuestions: { orderBy: { order: 'asc' } }
    }
  });

  return (
    <main className="grid">
      <section className="card">
        <h1>Admin Console</h1>
        <p>Manage users, teams, assignments, and AI course draft generation.</p>
      </section>

      <section className="card">
        <h2>Create User</h2>
        <form method="post" action="/api/admin/users">
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <label>Role
            <select name="role" defaultValue="LEARNER">
              <option value="LEARNER">Learner</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label>Team
            <select name="teamId">
              <option value="">None</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <button type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <h2>Users</h2>
        <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th></tr></thead><tbody>
          {users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.team?.name ?? '-'}</td></tr>)}
        </tbody></table>
      </section>

      <section className="card">
        <h2>AI Content Studio</h2>
        <form method="post" action="/api/admin/ai-studio">
          <label>Course title<input name="title" placeholder="Optional override title" /></label>
          <label>SOP / policy text<textarea name="sourceText" rows={8} required /></label>
          <label>Quiz requirement
            <select name="quizRequirement" defaultValue="OPTIONAL">
              <option value="OFF">OFF</option>
              <option value="OPTIONAL">OPTIONAL</option>
              <option value="REQUIRED">REQUIRED</option>
            </select>
          </label>
          <button type="submit">Generate Draft Course</button>
        </form>
        <p style={{ fontSize: '.85rem' }}>Avoid pasting personal data. Generated output is always saved as Draft and never auto published.</p>
      </section>

      <section className="card">
        <h2>Courses</h2>
        <ul>{courses.map((c) => <li key={c.id}>{c.title} , {c.status} , {c.quizRequirement}</li>)}</ul>
      </section>

      <section className="card">
        <h2>Draft Course Editing and Publishing</h2>
        {courses.filter((course) => course.status === 'DRAFT').map((course) => (
          <article key={course.id} style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginTop: '1rem' }}>
            <h3>{course.title}</h3>
            <form method="post" action={`/api/admin/courses/${course.id}`}>
              <label>Description
                <textarea name="description" rows={3} defaultValue={course.description} required />
              </label>

              {course.modules.map((m) => (
                <label key={m.id}>Module {m.order} , {m.title}
                  <textarea name={`module_${m.id}_lessonText`} rows={5} defaultValue={m.lessonText} required />
                </label>
              ))}

              {course.quizQuestions.map((q) => (
                <div key={q.id}>
                  <label>Quiz {q.order} question
                    <input name={`question_${q.id}_text`} defaultValue={q.question} required />
                  </label>
                  {Array.isArray(q.options) ? (
                    <label>Options, one per line
                      <textarea
                        name={`question_${q.id}_options`}
                        rows={4}
                        defaultValue={(q.options as string[]).join('\n')}
                        required
                      />
                    </label>
                  ) : null}
                  <label>Correct answer
                    <input name={`question_${q.id}_correctAnswer`} defaultValue={q.correctAnswer} required />
                  </label>
                </div>
              ))}

              <label>Course status
                <select name="status" defaultValue={course.status}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>
              <button type="submit">Save Draft Course</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
