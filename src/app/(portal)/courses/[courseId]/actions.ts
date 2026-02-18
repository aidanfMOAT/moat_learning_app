'use server';

import { QuizRequirement } from '@prisma/client';
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
  revalidatePath(`/courses/${courseId}`);
}

export async function completeCourse(courseId: string, formData: FormData) {
  const session = await requireSession();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const progress = await prisma.courseProgress.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId } } });

  if (!course) throw new Error('Course not found');
  const requiresAcknowledgement = course.title === 'IT Access Control, MOAT';
  const acknowledgementText = 'I acknowledge I have read and understood the IT Access Control Policy';
  const acknowledged = String(formData.get('acknowledgement') ?? '') === acknowledgementText;

  if (requiresAcknowledgement && !acknowledged) {
    throw new Error('Please confirm the acknowledgement before completing this course');
  }

  if (course.quizRequirement === QuizRequirement.REQUIRED && !(progress?.bestQuizScore && progress.bestQuizScore >= (course.passMarkPercent ?? 80))) {
    throw new Error('Quiz is required and must be passed first');
  }

  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: { userId: session.user.id, courseId, status: 'COMPLETED', completionDate: new Date(), startedAt: new Date(), lastActivityAt: new Date() },
    update: { status: 'COMPLETED', completionDate: new Date(), lastActivityAt: new Date() }
  });

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
