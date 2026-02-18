import { QuizRequirement } from '@prisma/client';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { completeCourse, markStarted, submitQuiz } from './actions';

export default async function CourseDetail({ params }: { params: { courseId: string } }) {
  const session = await requireSession();
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: { orderBy: { order: 'asc' } },
      quizQuestions: { orderBy: { order: 'asc' } },
      progress: { where: { userId: session.user.id } },
      quizAttempts: { where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } }
    }
  });

  if (!course) notFound();
  const progress = course.progress[0];
  const acknowledgementText = 'I acknowledge I have read and understood the IT Access Control Policy';
  const requiresAcknowledgement = course.title === 'IT Access Control, MOAT';

  return (
    <main className="grid">
      <section className="card">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <p>Status: <span className="badge">{progress?.status ?? 'NOT_STARTED'}</span></p>
        <form action={async () => { 'use server'; await markStarted(course.id); }} style={{ display: 'inline-block', marginRight: '.6rem' }}><button type="submit">Mark In Progress</button></form>
        <form action={async (fd) => { 'use server'; await completeCourse(course.id, fd); }} style={{ display: 'inline-block' }}>
          {requiresAcknowledgement ? (
            <label>
              <input type="checkbox" name="acknowledgement" value={acknowledgementText} required /> {acknowledgementText}
            </label>
          ) : null}
          <button type="submit">Mark Completed</button>
        </form>
      </section>

      <section className="card">
        <h2>Modules</h2>
        {course.modules.map((m) => (
          <article key={m.id} style={{ marginBottom: '1rem' }}>
            <h3>{m.order}. {m.title}</h3>
            <p>{m.lessonText}</p>
            {m.resourceUrl ? <p><a href={m.resourceUrl} target="_blank">Resource Link</a></p> : null}
            {m.videoUrl ? <p><a href={m.videoUrl} target="_blank">Video Link</a></p> : null}
          </article>
        ))}
      </section>

      {course.quizRequirement !== QuizRequirement.OFF ? (
        <section className="card">
          <h2>Quiz ({course.quizRequirement})</h2>
          <p>Pass mark: {course.passMarkPercent ?? 80}% · Max attempts: {course.maxQuizAttempts ?? 'Unlimited'}</p>
          <p>Best: {progress?.bestQuizScore ?? '-'} · Latest: {progress?.latestQuizScore ?? '-'} · Attempts: {progress?.quizAttemptCount ?? 0}</p>

          <form action={async (fd) => { 'use server'; await submitQuiz(course.id, fd); }}>
            {course.quizQuestions.map((q) => (
              <label key={q.id}>
                <strong>{q.order}. {q.question}</strong>
                {q.type === 'MULTIPLE_CHOICE' ? (
                  <select name={`q_${q.id}`} required>
                    <option value="">Select</option>
                    {Array.isArray(q.options) ? (q.options as string[]).map((opt) => <option key={opt} value={opt}>{opt}</option>) : null}
                  </select>
                ) : (
                  <select name={`q_${q.id}`} required>
                    <option value="">Select</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                )}
              </label>
            ))}
            <button type="submit">Submit Quiz Attempt</button>
          </form>

          <h3>Attempt History</h3>
          <ul>
            {course.quizAttempts.map((a) => (
              <li key={a.id}>{a.createdAt.toISOString()} · {a.score}% · {a.passed ? 'Pass' : 'Fail'}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
