export type GeneratedCourse = {
  title: string;
  description: string;
  objectives: string[];
  modules: Array<{ title: string; lessonText: string }>;
  questions: Array<{ question: string; type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE'; options?: string[]; correctAnswer: string }>;
};

export function generateCourseDraftFromText(input: string): GeneratedCourse {
  const clean = input.replace(/\s+/g, ' ').trim();
  const snippets = clean.split('.').map((s) => s.trim()).filter(Boolean).slice(0, 8);

  return {
    title: `Draft: ${snippets[0]?.slice(0, 60) || 'Policy Training'}`,
    description: 'AI-assisted draft generated from pasted SOP/policy content. Review before publishing.',
    objectives: snippets.slice(0, 3).map((s) => `Understand: ${s.slice(0, 100)}`),
    modules: [
      { title: 'Overview', lessonText: snippets.slice(0, 2).join('. ') || clean.slice(0, 300) },
      { title: 'Key Process Steps', lessonText: snippets.slice(2, 5).join('. ') || clean.slice(0, 300) },
      { title: 'Compliance & Quality Checks', lessonText: snippets.slice(5, 8).join('. ') || clean.slice(0, 300) }
    ],
    questions: Array.from({ length: 10 }).map((_, i) => ({
      question: `Q${i + 1}: Which statement best reflects the SOP requirement #${i + 1}?`,
      type: i % 3 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
      options: i % 3 === 0 ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: i % 3 === 0 ? 'True' : 'Option A'
    }))
  };
}
