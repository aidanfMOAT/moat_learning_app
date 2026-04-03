import { QuestionType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { generateCourseDraftFromText } from '@/lib/ai-studio';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function POST(req: Request) {
  await requireRole(['ADMIN']);
  const formData = await req.formData();
  const sourceText = String(formData.get('sourceText') ?? '').trim();
  const providedTitle = String(formData.get('title') ?? '').trim();
  const quizRequirement = String(formData.get('quizRequirement') ?? 'OPTIONAL');

  if (!sourceText) return NextResponse.json({ error: 'sourceText required' }, { status: 400 });

  const draft = generateCourseDraftFromText(sourceText);

  const created = await prisma.course.create({
    data: {
      title: providedTitle || draft.title,
      description: `${draft.description}\n\nObjectives:\n${draft.objectives.map((o) => `- ${o}`).join('\n')}`,
      status: 'DRAFT',
      quizRequirement,
      passMarkPercent: quizRequirement === 'OFF' ? null : 80,
      modules: {
        create: draft.modules.map((m, i) => ({ title: m.title, lessonText: m.lessonText, order: i + 1 }))
      },
      quizQuestions: quizRequirement === 'OFF'
        ? undefined
        : {
            create: draft.questions.map((q, i) => ({
              order: i + 1,
              question: q.question,
              type: q.type as QuestionType,
              options: q.options ?? null,
              correctAnswer: q.correctAnswer
            }))
          }
    }
  });

  return NextResponse.json({ id: created.id, status: 'draft_created' }, { status: 201 });
}
