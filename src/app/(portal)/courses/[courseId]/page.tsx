import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { CoursePlayer } from '@/components/course-player';
import { completeCourse, markStarted, submitQuizForResult } from './actions';

export default async function CourseDetail({ params }: { params: { courseId: string } }) {
  const session = await requireSession();
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: { orderBy: { order: 'asc' } },
      quizQuestions: { orderBy: { order: 'asc' } },
      progress: { where: { userId: session.user.id } },
    }
  });

  if (!course) notFound();

  const progress = course.progress[0] ?? null;

  const questions = course.quizQuestions.map((q) => ({
    id: q.id,
    question: q.question,
    type: q.type,
    options: q.options ? JSON.parse(q.options) : [],
    order: q.order,
  }));

  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessonText: m.lessonText,
    resourceUrl: m.resourceUrl,
    videoUrl: m.videoUrl,
    imageUrl: m.imageUrl,
  }));

  const boundMarkStarted = markStarted.bind(null, course.id);
  const boundCompleteCourse = completeCourse.bind(null, course.id);

  return (
    <CoursePlayer
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
        quizRequirement: course.quizRequirement,
        passMarkPercent: course.passMarkPercent,
        maxQuizAttempts: course.maxQuizAttempts,
        requiresAcknowledgement: course.requiresAcknowledgement,
      }}
      modules={modules}
      questions={questions}
      initialProgress={
        progress
          ? {
              status: progress.status,
              bestQuizScore: progress.bestQuizScore,
              latestQuizScore: progress.latestQuizScore,
              quizAttemptCount: progress.quizAttemptCount,
            }
          : null
      }
      markStarted={boundMarkStarted}
      submitQuizForResult={submitQuizForResult}
      completeCourse={boundCompleteCourse}
    />
  );
}
