'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { submitQuizAttempt } from '@/lib/quiz';
import { requireSession } from '@/lib/session';

export async function markStarted(courseId: string) {
  const session = await requireSession();
  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: { userId: session.user.id, courseId, status: 'IN_PROGRESS', startedAt: new Date(), lastActivityAt: new Date() },
    update: { status: 'IN_PROGRESS', lastActivityAt: new Date() }
  });
  await prisma.auditLog.create({
    data: { userId: session.user.id, courseId, event: 'COURSE_STARTED' }
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function completeCourse(courseId: string, formData: FormData) {
  const session = await requireSession();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const progress = await prisma.courseProgress.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId } } });

  if (!course) throw new Error('Course not found');

  const acknowledged = !!formData.get('acknowledgement');
  if (course.requiresAcknowledgement && !acknowledged) {
    throw new Error('Please confirm the acknowledgement before completing this course');
  }

  if (course.quizRequirement === 'REQUIRED' && !(progress?.bestQuizScore && progress.bestQuizScore >= (course.passMarkPercent ?? 80))) {
    throw new Error('Quiz is required and must be passed first');
  }

  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: { userId: session.user.id, courseId, status: 'COMPLETED', completionDate: new Date(), startedAt: new Date(), lastActivityAt: new Date() },
    update: { status: 'COMPLETED', completionDate: new Date(), lastActivityAt: new Date() }
  });

  const events: Array<{ userId: string; courseId: string; event: string; detail?: string }> = [
    { userId: session.user.id, courseId, event: 'COURSE_COMPLETED' }
  ];
  if (acknowledged) {
    events.push({ userId: session.user.id, courseId, event: 'ACK_SIGNED', detail: 'Learner confirmed understanding' });
  }
  await prisma.auditLog.createMany({ data: events });

  revalidatePath(`/courses/${courseId}`);
}

export async function submitQuiz(courseId: string, formData: FormData) {
  const session = await requireSession();
  const entries = Array.from(formData.entries())
    .filter(([k]) => k.startsWith('q_'))
    .map(([k, v]) => ({ questionId: k.replace('q_', ''), answer: String(v) }));

  await submitQuizAttempt(session.user.id, courseId, entries);
  revalidatePath(`/courses/${courseId}`);
}

export async function submitQuizForResult(
  courseId: string,
  answers: { questionId: string; answer: string }[]
): Promise<{ score: number; passed: boolean; attemptsRemaining: number | null }> {
  const session = await requireSession();
  const result = await submitQuizAttempt(session.user.id, courseId, answers);
  revalidatePath(`/courses/${courseId}`);
  return result;
}
