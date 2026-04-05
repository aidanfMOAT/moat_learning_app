import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const [adminPass, managerPass, learnerPass] = await Promise.all([
    bcrypt.hash('Admin123!', 10),
    bcrypt.hash('Manager123!', 10),
    bcrypt.hash('Learner123!', 10)
  ]);

  // ── Teams ────────────────────────────────────────────────────────────────
  const teamNorth = await prisma.team.create({ data: { name: 'North Region' } });
  const teamSouth = await prisma.team.create({ data: { name: 'South Region' } });

  // ── Users ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@moat.local', role: 'ADMIN', passwordHash: adminPass }
  });

  const managerNorth = await prisma.user.create({
    data: { name: 'Mia Manager', email: 'manager@moat.local', role: 'MANAGER', teamId: teamNorth.id, passwordHash: managerPass }
  });
  const managerSouth = await prisma.user.create({
    data: { name: 'Marcus Manager', email: 'manager2@moat.local', role: 'MANAGER', teamId: teamSouth.id, passwordHash: managerPass }
  });

  await prisma.team.update({ where: { id: teamNorth.id }, data: { managerId: managerNorth.id } });
  await prisma.team.update({ where: { id: teamSouth.id }, data: { managerId: managerSouth.id } });

  const learner1 = await prisma.user.create({
    data: { name: 'Lee Learner', email: 'learner1@moat.local', role: 'LEARNER', teamId: teamNorth.id, passwordHash: learnerPass }
  });
  const learner2 = await prisma.user.create({
    data: { name: 'Sam Scholar', email: 'learner2@moat.local', role: 'LEARNER', teamId: teamSouth.id, passwordHash: learnerPass }
  });
  const learner3 = await prisma.user.create({
    data: { name: 'Alex Apprentice', email: 'learner3@moat.local', role: 'LEARNER', teamId: teamNorth.id, passwordHash: learnerPass }
  });
  const learner4 = await prisma.user.create({
    data: { name: 'Jordan Jones', email: 'learner4@moat.local', role: 'LEARNER', teamId: teamSouth.id, passwordHash: learnerPass }
  });
  const learner5 = await prisma.user.create({
    data: { name: 'Riley Reader', email: 'learner5@moat.local', role: 'LEARNER', teamId: teamNorth.id, passwordHash: learnerPass }
  });

  const allLearners = [learner1, learner2, learner3, learner4, learner5];

  // ── Courses ──────────────────────────────────────────────────────────────
  const courseOptional = await prisma.course.create({
    data: {
      title: 'Customer Support Basics',
      description: 'Introductory service standards and escalation patterns.',
      status: 'PUBLISHED',
      quizRequirement: 'OPTIONAL',
      passMarkPercent: 70,
      modules: {
        create: [
          { order: 1, title: 'Welcome', lessonText: 'Understand support tone and response SLAs.' },
          { order: 2, title: 'Escalation', lessonText: 'How to escalate incidents cleanly.', resourceUrl: 'https://example.com/escalation-guide' }
        ]
      },
      quizQuestions: {
        create: [
          { order: 1, question: 'First response SLA is within 24 hours.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'True' },
          { order: 2, question: 'Best escalation owner for billing issue?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Engineering', 'Finance', 'Support', 'Legal']), correctAnswer: 'Finance' }
        ]
      }
    }
  });

  const courseRequired = await prisma.course.create({
    data: {
      title: 'Information Security Essentials',
      description: 'Security policy, data handling, and incident reporting.',
      status: 'PUBLISHED',
      quizRequirement: 'REQUIRED',
      passMarkPercent: 80,
      maxQuizAttempts: 3,
      modules: {
        create: [
          { order: 1, title: 'Policy Foundations', lessonText: 'Why policy controls matter.' },
          { order: 2, title: 'Reporting', lessonText: 'Report suspicious activity immediately.', videoUrl: 'https://example.com/security-video' }
        ]
      },
      quizQuestions: {
        create: [
          { order: 1, question: 'Sharing passwords is allowed if temporary.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'False' },
          { order: 2, question: 'Where should incidents be reported?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Security channel', 'Social media', 'Ignore', 'Vendor newsletter']), correctAnswer: 'Security channel' }
        ]
      }
    }
  });

  const courseESG = await prisma.course.create({
    data: {
      title: 'ESG Awareness & Responsibilities',
      description: 'Environmental, social and governance obligations every employee must understand.',
      status: 'PUBLISHED',
      quizRequirement: 'REQUIRED',
      requiresAcknowledgement: true,
      passMarkPercent: 75,
      maxQuizAttempts: 3,
      modules: {
        create: [
          { order: 1, title: 'What is ESG?', lessonText: 'ESG stands for Environmental, Social, and Governance. These three pillars guide responsible business conduct.' },
          { order: 2, title: 'Environmental Obligations', lessonText: 'Reduce carbon footprint, report emissions accurately, and avoid greenwashing.' },
          { order: 3, title: 'Social Responsibilities', lessonText: 'Fair treatment of employees, supply-chain ethics, and community engagement.' },
          { order: 4, title: 'Governance Standards', lessonText: 'Anti-bribery, conflicts of interest, accurate reporting, and whistleblower protections.' }
        ]
      },
      quizQuestions: {
        create: [
          { order: 1, question: 'ESG stands for Environmental, Social, and Governance.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'True' },
          { order: 2, question: 'Greenwashing refers to?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Accurate sustainability reporting', 'Misleading environmental claims', 'A recycling programme', 'Carbon offset trading']), correctAnswer: 'Misleading environmental claims' },
          { order: 3, question: 'Accepting gifts from suppliers over the policy limit is acceptable if kept confidential.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'False' },
          { order: 4, question: 'Who should you report a governance concern to first?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Your direct manager or via the whistleblower channel', 'Social media', 'No one – wait for annual review', 'A competitor']), correctAnswer: 'Your direct manager or via the whistleblower channel' }
        ]
      }
    }
  });

  const accessControlCourse = await prisma.course.create({
    data: {
      title: 'IT Access Control, MOAT',
      description: 'Practical access control requirements for all staff and third parties working with MOAT systems and data.',
      status: 'PUBLISHED',
      quizRequirement: 'OPTIONAL',
      requiresAcknowledgement: true,
      passMarkPercent: 80,
      maxQuizAttempts: 3,
      modules: {
        create: [
          { order: 1, title: 'Scope, purpose, and your responsibilities', lessonText: 'This policy applies across MOAT entities, and applies to employees, contractors, consultants, associates, and third parties with system access.' },
          { order: 2, title: 'Core access control principles', lessonText: 'MOAT applies core principles to reduce risk and protect confidentiality, integrity, and availability of information.' },
          { order: 3, title: 'Access requests, provisioning, changes, and leavers', lessonText: 'Access lifecycle controls ensure access stays appropriate from joiner to leaver.' },
          { order: 4, title: 'Authentication, privileged access, and remote access', lessonText: 'Strong authentication and controlled privileged access reduce account compromise risk.' },
          { order: 5, title: 'Reviews, monitoring, third parties, and incident response', lessonText: 'Regular review and monitoring help identify inappropriate access and reduce exposure.' }
        ]
      },
      quizQuestions: {
        create: [
          { order: 1, question: 'Access must be approved before provisioning.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'True' },
          { order: 2, question: 'Which option best matches least privilege?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['All systems access by default', 'Minimum access needed for role', 'Shared admin account for teams', 'No access reviews needed']), correctAnswer: 'Minimum access needed for role' },
          { order: 3, question: 'RBAC means access is assigned based on job role wherever possible.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'True' },
          { order: 4, question: 'When must leavers access be removed?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Within 30 days', 'On or before final working day', 'At next quarterly review', 'Only if requested by IT']), correctAnswer: 'On or before final working day' },
          { order: 5, question: 'Privileged accounts can be used for routine emails and admin tasks to save time.', type: 'TRUE_FALSE', options: JSON.stringify(['True', 'False']), correctAnswer: 'False' }
        ]
      }
    }
  });

  // ── Assignments ──────────────────────────────────────────────────────────
  await prisma.assignment.createMany({
    data: [
      { courseId: courseOptional.id, scope: 'EVERYONE', assignedById: admin.id },
      { courseId: courseRequired.id, scope: 'EVERYONE', assignedById: admin.id },
      { courseId: courseESG.id, scope: 'EVERYONE', assignedById: admin.id },
      { courseId: accessControlCourse.id, scope: 'EVERYONE', assignedById: admin.id }
    ]
  });

  // ── Helper to create progress + audit entries ────────────────────────────
  async function addProgress(
    userId: string,
    courseId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
    opts: {
      startedDaysAgo?: number;
      completedDaysAgo?: number;
      quizAttempts?: Array<{ score: number; passed: boolean; daysAgo: number }>;
      acknowledged?: boolean;
    } = {}
  ) {
    const started = opts.startedDaysAgo !== undefined ? daysAgo(opts.startedDaysAgo) : undefined;
    const completed = opts.completedDaysAgo !== undefined ? daysAgo(opts.completedDaysAgo) : undefined;
    const lastActivity = completed ?? started ?? undefined;

    const quizScores = opts.quizAttempts?.map((a) => a.score) ?? [];
    const bestScore = quizScores.length ? Math.max(...quizScores) : undefined;
    const latestScore = quizScores.length ? quizScores[quizScores.length - 1] : undefined;

    await prisma.courseProgress.create({
      data: {
        userId,
        courseId,
        status,
        startedAt: started,
        completionDate: completed,
        lastActivityAt: lastActivity,
        bestQuizScore: bestScore,
        latestQuizScore: latestScore,
        quizAttemptCount: quizScores.length
      }
    });

    const auditRows: Array<{ userId: string; courseId: string; event: string; detail?: string; createdAt: Date }> = [];

    if (started) {
      auditRows.push({ userId, courseId, event: 'COURSE_STARTED', createdAt: started });
    }

    for (const attempt of opts.quizAttempts ?? []) {
      await prisma.quizAttempt.create({
        data: { userId, courseId, score: attempt.score, passed: attempt.passed, createdAt: daysAgo(attempt.daysAgo) }
      });
      auditRows.push({
        userId,
        courseId,
        event: attempt.passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED',
        detail: JSON.stringify({ score: attempt.score, passMark: 80 }),
        createdAt: daysAgo(attempt.daysAgo)
      });
    }

    if (opts.acknowledged && completed) {
      auditRows.push({ userId, courseId, event: 'ACK_SIGNED', detail: 'Learner confirmed understanding', createdAt: completed });
    }

    if (completed) {
      auditRows.push({ userId, courseId, event: 'COURSE_COMPLETED', createdAt: completed });
    }

    for (const row of auditRows) {
      await prisma.auditLog.create({ data: row });
    }
  }

  // ── Lee Learner (North) – compliant, finished everything ─────────────────
  await addProgress(learner1.id, courseOptional.id, 'COMPLETED', {
    startedDaysAgo: 60, completedDaysAgo: 55,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 56 }]
  });
  await addProgress(learner1.id, courseRequired.id, 'COMPLETED', {
    startedDaysAgo: 50, completedDaysAgo: 44,
    quizAttempts: [
      { score: 50, passed: false, daysAgo: 48 },
      { score: 100, passed: true, daysAgo: 45 }
    ]
  });
  await addProgress(learner1.id, courseESG.id, 'COMPLETED', {
    startedDaysAgo: 30, completedDaysAgo: 25,
    quizAttempts: [{ score: 75, passed: true, daysAgo: 26 }],
    acknowledged: true
  });
  await addProgress(learner1.id, accessControlCourse.id, 'COMPLETED', {
    startedDaysAgo: 20, completedDaysAgo: 18,
    acknowledged: true
  });

  // ── Sam Scholar (South) – mostly done, one course in progress ────────────
  await addProgress(learner2.id, courseOptional.id, 'COMPLETED', {
    startedDaysAgo: 58, completedDaysAgo: 52,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 53 }]
  });
  await addProgress(learner2.id, courseRequired.id, 'COMPLETED', {
    startedDaysAgo: 45, completedDaysAgo: 40,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 41 }]
  });
  await addProgress(learner2.id, courseESG.id, 'IN_PROGRESS', {
    startedDaysAgo: 10,
    quizAttempts: [{ score: 50, passed: false, daysAgo: 8 }]
  });
  await addProgress(learner2.id, accessControlCourse.id, 'NOT_STARTED');

  // ── Alex Apprentice (North) – new starter, just begun ───────────────────
  await addProgress(learner3.id, courseOptional.id, 'IN_PROGRESS', { startedDaysAgo: 5 });
  await addProgress(learner3.id, courseRequired.id, 'NOT_STARTED');
  await addProgress(learner3.id, courseESG.id, 'NOT_STARTED');
  await addProgress(learner3.id, accessControlCourse.id, 'NOT_STARTED');

  // ── Jordan Jones (South) – finished two, overdue on security ────────────
  await addProgress(learner4.id, courseOptional.id, 'COMPLETED', {
    startedDaysAgo: 70, completedDaysAgo: 65,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 66 }]
  });
  await addProgress(learner4.id, courseRequired.id, 'IN_PROGRESS', {
    startedDaysAgo: 40,
    quizAttempts: [
      { score: 60, passed: false, daysAgo: 38 },
      { score: 70, passed: false, daysAgo: 35 }
    ]
  });
  await addProgress(learner4.id, courseESG.id, 'NOT_STARTED');
  await addProgress(learner4.id, accessControlCourse.id, 'COMPLETED', {
    startedDaysAgo: 55, completedDaysAgo: 50,
    acknowledged: true
  });

  // ── Riley Reader (North) – exemplary record ──────────────────────────────
  await addProgress(learner5.id, courseOptional.id, 'COMPLETED', {
    startedDaysAgo: 80, completedDaysAgo: 75,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 76 }]
  });
  await addProgress(learner5.id, courseRequired.id, 'COMPLETED', {
    startedDaysAgo: 74, completedDaysAgo: 70,
    quizAttempts: [{ score: 100, passed: true, daysAgo: 71 }]
  });
  await addProgress(learner5.id, courseESG.id, 'COMPLETED', {
    startedDaysAgo: 35, completedDaysAgo: 30,
    quizAttempts: [{ score: 75, passed: true, daysAgo: 31 }],
    acknowledged: true
  });
  await addProgress(learner5.id, accessControlCourse.id, 'COMPLETED', {
    startedDaysAgo: 28, completedDaysAgo: 24,
    acknowledged: true
  });

  console.log('Seed complete');
  console.log('Admin:    admin@moat.local    / Admin123!');
  console.log('Manager:  manager@moat.local  / Manager123!  (North Region)');
  console.log('Manager:  manager2@moat.local / Manager123!  (South Region)');
  for (let i = 1; i <= 5; i++) {
    const names = ['Lee Learner', 'Sam Scholar', 'Alex Apprentice', 'Jordan Jones', 'Riley Reader'];
    console.log(`Learner ${i}: learner${i}@moat.local / Learner123!  (${names[i - 1]})`);
  }
}

main().finally(async () => prisma.$disconnect());
