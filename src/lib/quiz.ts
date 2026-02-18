import { ProgressStatus, QuizRequirement } from '@prisma/client';
import { prisma } from './prisma';

export type SubmittedAnswer = { questionId: string; answer: string };

export function scoreQuiz(
  questions: Array<{ id: string; correctAnswer: string }>,
  answers: SubmittedAnswer[]
): number {
  if (!questions.length) return 0;
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer.trim().toLowerCase()]));
  const correct = questions.filter(
    (q) => answerMap.get(q.id) === q.correctAnswer.trim().toLowerCase()
  ).length;
  return Math.round((correct / questions.length) * 100);
}

export function canAttempt(currentAttempts: number, maxAttempts: number | null | undefined): boolean {
  if (!maxAttempts) return true;
  return currentAttempts < maxAttempts;
}

export async function submitQuizAttempt(userId: string, courseId: string, answers: SubmittedAnswer[]) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { quizQuestions: { orderBy: { order: 'asc' } } }
  });

  if (!course) throw new Error('Course not found');
  if (course.quizRequirement === QuizRequirement.OFF) throw new Error('Quiz is disabled for this course');

  const progress = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: ProgressStatus.IN_PROGRESS, startedAt: new Date(), lastActivityAt: new Date() },
    update: { status: ProgressStatus.IN_PROGRESS, lastActivityAt: new Date() }
  });

  if (!canAttempt(progress.quizAttemptCount, course.maxQuizAttempts)) {
    throw new Error('Maximum attempts reached');
  }

  const score = scoreQuiz(course.quizQuestions, answers);
  const passMark = course.passMarkPercent ?? 80;
  const passed = score >= passMark;

  const attempt = await prisma.quizAttempt.create({
    data: { userId, courseId, score, passed }
  });

  const attemptCount = progress.quizAttemptCount + 1;
  const best = Math.max(progress.bestQuizScore ?? 0, score);

  await prisma.courseProgress.update({
    where: { id: progress.id },
    data: {
      latestQuizScore: score,
      bestQuizScore: best,
      quizAttemptCount: attemptCount,
      lastActivityAt: new Date(),
      status:
        passed || course.quizRequirement !== QuizRequirement.REQUIRED
          ? ProgressStatus.COMPLETED
          : ProgressStatus.IN_PROGRESS,
      completionDate:
        passed || course.quizRequirement !== QuizRequirement.REQUIRED ? new Date() : null
    }
  });

  return { attempt, score, passed, attemptsRemaining: course.maxQuizAttempts ? course.maxQuizAttempts - attemptCount : null };
}
