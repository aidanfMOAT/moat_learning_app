import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    await requireRole(['ADMIN']);
    const formData = await req.formData();
    const courseId = params.courseId;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: true, quizQuestions: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const statusValue = String(formData.get('status') ?? course.status);
    const status = VALID_STATUSES.includes(statusValue) ? statusValue : course.status;
    const description = String(formData.get('description') ?? course.description).trim();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    await prisma.course.update({
      where: { id: courseId },
      data: {
        status,
        description
      }
    });

    for (const courseModule of course.modules) {
      const lessonText = String(formData.get(`module_${courseModule.id}_lessonText`) ?? courseModule.lessonText).trim();
      if (lessonText) {
        await prisma.module.update({
          where: { id: courseModule.id },
          data: { lessonText }
        });
      }
    }

    for (const question of course.quizQuestions) {
      const text = String(formData.get(`question_${question.id}_text`) ?? question.question).trim();
      const correctAnswer = String(formData.get(`question_${question.id}_correctAnswer`) ?? question.correctAnswer).trim();
      const optionsRaw = String(formData.get(`question_${question.id}_options`) ?? '').trim();

      if (text && correctAnswer) {
        await prisma.quizQuestion.update({
          where: { id: question.id },
          data: {
            question: text,
            correctAnswer,
            options:
              question.type === 'MULTIPLE_CHOICE'
                ? JSON.stringify(optionsRaw.split('\n').map((v) => v.trim()).filter(Boolean))
                : JSON.stringify(['True', 'False'])
          }
        });
      }
    }

    return NextResponse.redirect(new URL('/admin', req.url));
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
