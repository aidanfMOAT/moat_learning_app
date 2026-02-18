import { CourseStatus, QuestionType, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  await requireRole([Role.ADMIN]);
  const formData = await req.formData();
  const courseId = params.courseId;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: true, quizQuestions: true }
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const status = String(formData.get('status') ?? course.status) as CourseStatus;
  const description = String(formData.get('description') ?? course.description).trim();

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status,
      description
    }
  });

  for (const courseModule of course.modules) {
    const lessonText = String(formData.get(`module_${courseModule.id}_lessonText`) ?? courseModule.lessonText).trim();
    await prisma.module.update({
      where: { id: courseModule.id },
      data: { lessonText }
    });
  }

  for (const question of course.quizQuestions) {
    const text = String(formData.get(`question_${question.id}_text`) ?? question.question).trim();
    const correctAnswer = String(formData.get(`question_${question.id}_correctAnswer`) ?? question.correctAnswer).trim();
    const optionsRaw = String(formData.get(`question_${question.id}_options`) ?? '').trim();

    await prisma.quizQuestion.update({
      where: { id: question.id },
      data: {
        question: text,
        correctAnswer,
        options:
          question.type === QuestionType.MULTIPLE_CHOICE
            ? optionsRaw.split('\n').map((v) => v.trim()).filter(Boolean)
            : ['True', 'False']
      }
    });
  }

  return NextResponse.redirect(new URL('/admin', req.url));
}
