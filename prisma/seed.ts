import bcrypt from 'bcryptjs';
import { AssignmentScope, CourseStatus, PrismaClient, QuestionType, QuizRequirement, Role } from '@prisma/client';

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

  const accessControlCourse = await prisma.course.create({
    data: {
      title: 'IT Access Control, MOAT',
      description: 'Practical access control requirements for all staff and third parties working with MOAT systems and data.',
      status: CourseStatus.DRAFT,
      quizRequirement: QuizRequirement.OPTIONAL,
      passMarkPercent: 80,
      maxQuizAttempts: 3,
      modules: {
        create: [
          {
            order: 1,
            title: 'Scope, purpose, and your responsibilities',
            lessonText: `This policy applies across MOAT entities, and applies to employees, contractors, consultants, associates, and third parties with system access.\n\nWhat this means in practice:\n, Access must be approved before use\n, Access must match your current role and business need\n, Access must be removed quickly when no longer needed\n, You are accountable for how your account is used\n\nWhat you must do\n, Use only the systems you are authorised to access\n, Ask your line manager to request access changes, do not bypass the process\n, Report any access concerns immediately`
          },
          {
            order: 2,
            title: 'Core access control principles',
            lessonText: `MOAT applies core principles to reduce risk and protect confidentiality, integrity, and availability of information.\n\nKey terms\n, Least privilege, you receive only the minimum access needed\n, RBAC, access is granted by job role rather than by individual preference\n, Segregation of duties, critical high risk steps are split across people\n, Privileged access, elevated administrative rights with extra controls\n, MFA, multi factor authentication to strengthen account security\n\nWhat you must do\n, Request only the minimum access needed for your duties\n, Do not combine conflicting high risk tasks without approval\n, Never share credentials, use your unique account only`
          },
          {
            order: 3,
            title: 'Access requests, provisioning, changes, and leavers',
            lessonText: `Access lifecycle controls ensure access stays appropriate from joiner to leaver.\n\nAccess request and approval requirements\n, Line manager raises the request\n, Request includes business justification\n, Approval is completed before provisioning\n, Records are retained for audit\n\nProvisioning and change requirements\n, Only authorised personnel can provision access\n, Default passwords must be changed at first sign in\n, Access changes must be completed promptly after role changes\n, Temporary access must be removed at expiry\n\nLeavers and urgent revocation\n, Remove access immediately when employment or contract ends\n, Remove access when no longer required\n, Disable access if a security concern exists\n, Leavers access must be removed by final working day\n\nWhat you must do\n, Notify line managers and system owners quickly when responsibilities change\n, Check temporary access expiry dates and request removal on time\n, Escalate overdue revocation immediately`
          },
          {
            order: 4,
            title: 'Authentication, privileged access, and remote access',
            lessonText: `Strong authentication and controlled privileged access reduce account compromise risk.\n\nAuthentication requirements\n, Unique user IDs\n, MFA for cloud and remote access\n, Passwords must meet policy standards\n, Account lockout follows repeated failed sign in attempts\n\nPrivileged access requirements\n, Formal authorisation is required\n, Access is restricted to named individuals\n, Activity is logged and monitored\n, Access is reviewed quarterly\n, Privileged accounts are not for routine day to day tasks\n\nRemote access requirements\n, Use secure encrypted connections\n, Use approved devices only\n, MFA is mandatory\n, Activity is monitored for anomalies\n, Public or shared devices must not be used for sensitive systems\n\nWhat you must do\n, Use MFA every time it is required, do not attempt workarounds\n, Use standard account for normal work, use privileged access only when authorised\n, Stop and report if you are asked to use a public or shared device for sensitive access`
          },
          {
            order: 5,
            title: 'Reviews, monitoring, third parties, and incident response',
            lessonText: `Regular review and monitoring help identify inappropriate access and reduce exposure.\n\nQuarterly access review checks\n, Access is still appropriate\n, Privileged access remains justified\n, Leavers have been removed\n, No orphaned accounts exist\n, Review outcomes are documented\n\nLogging and monitoring scope\n, Login attempts\n, Failed authentication attempts\n, Privileged account activity\n, Access changes\n\nThird party access controls\n, Access is contractually governed\n, Scope and duration are limited\n, Same security standards apply\n, Access is revoked at contract end\n, Temporary access has a defined expiry date\n\nSecurity incidents and enforcement\n, Suspected misuse, unauthorised access, or privilege escalation must be reported immediately\n, Compromised accounts are disabled pending investigation\n, Non compliance may lead to disciplinary action, access suspension, contract termination, or regulatory reporting\n\nWhat you must do\n, Complete quarterly review tasks if you are assigned as a reviewer\n, Report suspicious access activity immediately\n, Ensure third party access you sponsor has clear expiry and timely revocation`
          }
        ]
      },
      quizQuestions: {
        create: [
          {
            order: 1,
            question: 'Access must be approved before provisioning.',
            type: QuestionType.TRUE_FALSE,
            options: ['True', 'False'],
            correctAnswer: 'True'
          },
          {
            order: 2,
            question: 'Which option best matches least privilege?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: ['All systems access by default', 'Minimum access needed for role', 'Shared admin account for teams', 'No access reviews needed'],
            correctAnswer: 'Minimum access needed for role'
          },
          {
            order: 3,
            question: 'RBAC means access is assigned based on job role wherever possible.',
            type: QuestionType.TRUE_FALSE,
            options: ['True', 'False'],
            correctAnswer: 'True'
          },
          {
            order: 4,
            question: 'When must leavers access be removed?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: ['Within 30 days', 'On or before final working day', 'At next quarterly review', 'Only if requested by IT'],
            correctAnswer: 'On or before final working day'
          },
          {
            order: 5,
            question: 'Privileged accounts can be used for routine emails and admin tasks to save time.',
            type: QuestionType.TRUE_FALSE,
            options: ['True', 'False'],
            correctAnswer: 'False'
          },
          {
            order: 6,
            question: 'Which remote access practice is required?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: ['Use any public device if urgent', 'Use encrypted connection and MFA', 'Disable MFA for faster access', 'Share credentials with contractor'],
            correctAnswer: 'Use encrypted connection and MFA'
          },
          {
            order: 7,
            question: 'Access rights must be reviewed at least quarterly.',
            type: QuestionType.TRUE_FALSE,
            options: ['True', 'False'],
            correctAnswer: 'True'
          },
          {
            order: 8,
            question: 'Which activity should be logged and monitored?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: ['Privileged account activity', 'Only successful logins', 'Only public website visits', 'Only password reset emails'],
            correctAnswer: 'Privileged account activity'
          },
          {
            order: 9,
            question: 'Third party access should have defined scope and expiry dates.',
            type: QuestionType.TRUE_FALSE,
            options: ['True', 'False'],
            correctAnswer: 'True'
          },
          {
            order: 10,
            question: 'What should happen if credential misuse is suspected?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: ['Wait for quarterly review', 'Report immediately and disable compromised account pending investigation', 'Ignore first incident', 'Share details on social media'],
            correctAnswer: 'Report immediately and disable compromised account pending investigation'
          }
        ]
      }
    }
  });

  await prisma.assignment.createMany({
    data: [
      { courseId: courseOptional.id, scope: AssignmentScope.EVERYONE, assignedById: admin.id },
      { courseId: courseRequired.id, scope: AssignmentScope.TEAM, teamId: teamNorth.id, assignedById: admin.id },
      { courseId: courseRequired.id, scope: AssignmentScope.USER, userId: learner2.id, assignedById: admin.id },
      { courseId: accessControlCourse.id, scope: AssignmentScope.EVERYONE, assignedById: admin.id }
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
