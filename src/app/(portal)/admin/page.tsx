import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export default async function AdminPage() {
  await requireRole([Role.ADMIN]);
  const users = await prisma.user.findMany({ include: { team: true }, orderBy: { createdAt: 'asc' } });
  const teams = await prisma.team.findMany();
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });

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
        <p style={{ fontSize: '.85rem' }}>Avoid pasting personal data. Generated output is always saved as Draft and never auto-published.</p>
      </section>

      <section className="card">
        <h2>Courses</h2>
        <ul>{courses.map((c) => <li key={c.id}>{c.title} · {c.status} · {c.quizRequirement}</li>)}</ul>
      </section>
    </main>
  );
}
