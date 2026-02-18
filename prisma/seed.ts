import bcrypt from 'bcryptjs';
import { AssignmentScope, CourseStatus, PrismaClient, QuizRequirement, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  const teamNorth = await prisma.team.create({ data: { name: 'North Region' } });
  const teamSouth = await prisma.team.create({ data: { name: 'South Region' } });

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@moat.local', role: Role.ADMIN, passwordHash: adminPass }
  });

  const manager = await prisma.user.create({
    data: { name: 'Mia Manager', email: 'manager@moat.local', role: Role.MANAGER, teamId: teamNorth.id, passwordHash: managerPass }
  });

  await prisma.team.update({ where: { id: teamNorth.id }, data: { managerId: manager.id } });

  const learner1 = await prisma.user.create({
    data: { name: 'Lee Learner', email: 'learner1@moat.local', role: Role.LEARNER, teamId: teamNorth.id, passwordHash: learnerPass }
  });
  const learner2 = await prisma.user.create({
    data: { name: 'Sam Scholar', email: 'learner2@moat.local', role: Role.LEARNER, teamId: teamSouth.id, passwordHash: learnerPass }
  });

  const courseOptional = await prisma.course.create({
    data: {
      title: 'Customer Support Basics',
      description: 'Introductory service standards and escalation patterns.',
      status: CourseStatus.PUBLISHED,
      quizRequirement: QuizRequirement.OPTIONAL,
      passMarkPercent: 70,
      modules: {
        create: [
          { order: 1, title: 'Welcome', lessonText: 'Understand support tone and response SLAs.' },
          { order: 2, title: 'Escalation', lessonText: 'How to escalate incidents cleanly.', resourceUrl: 'https://example.com/escalation-guide' }
        ]
      },
      quizQuestions: {
        create: [
          {
            order: 1,
            question: 'First response SLA is within 24 hours.',
            type: 'TRUE_FALSE',
            options: ['True', 'False'],
            correctAnswer: 'True'
          },
          {
            order: 2,
            question: 'Best escalation owner for billing issue?',
            type: 'MULTIPLE_CHOICE',
            options: ['Engineering', 'Finance', 'Support', 'Legal'],
            correctAnswer: 'Finance'
          }
        ]
      }
    }
  });

  const courseRequired = await prisma.course.create({
    data: {
      title: 'Information Security Essentials',
      description: 'Security policy, data handling, and incident reporting.',
      status: CourseStatus.PUBLISHED,
      quizRequirement: QuizRequirement.REQUIRED,
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
          {
            order: 1,
            question: 'Sharing passwords is allowed if temporary.',
            type: 'TRUE_FALSE',
            options: ['True', 'False'],
            correctAnswer: 'False'
          },
          {
            order: 2,
            question: 'Where should incidents be reported?',
            type: 'MULTIPLE_CHOICE',
            options: ['Security channel', 'Social media', 'Ignore', 'Vendor newsletter'],
            correctAnswer: 'Security channel'
          }
        ]
      }
    }
  });

  await prisma.assignment.createMany({
    data: [
      { courseId: courseOptional.id, scope: AssignmentScope.EVERYONE, assignedById: admin.id },
      { courseId: courseRequired.id, scope: AssignmentScope.TEAM, teamId: teamNorth.id, assignedById: admin.id },
      { courseId: courseRequired.id, scope: AssignmentScope.USER, userId: learner2.id, assignedById: admin.id }
    ]
  });

  await prisma.courseProgress.createMany({
    data: [
      { userId: learner1.id, courseId: courseOptional.id, status: 'IN_PROGRESS', startedAt: new Date(), lastActivityAt: new Date() },
      { userId: learner2.id, courseId: courseOptional.id, status: 'NOT_STARTED' }
    ]
  });

  console.log('Seed complete');
  console.log('Admin login: admin@moat.local / Admin123!');
  console.log('Manager login: manager@moat.local / Manager123!');
  console.log('Learner login: learner1@moat.local / Learner123!');
}

main().finally(async () => prisma.$disconnect());
