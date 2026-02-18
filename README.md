# Moat Learning Portal

Small Learning & Development portal for 5–20 users built with **Next.js + TypeScript + Prisma + NextAuth**.

## Features
- Role-based experience: **Admin**, **Manager**, **Learner**
- Auth: login/logout and admin user creation
- Teams and team-based manager reporting
- Course authoring: Draft / Published / Archived, ordered modules with lesson text + links
- Assignments: user, team, everyone
- Per-user course tracking: status + completion timestamps + quiz aggregates
- Quizzes: OFF / OPTIONAL / REQUIRED, pass mark, max attempts, attempt history, score tracking
- Dashboards:
  - Learner: assigned / in progress / completed
  - Manager: team completion and at-risk list
  - Admin: aggregate snapshot and CSV export
- AI Content Studio (admin only): paste SOP/policy text, generate draft course + optional quiz questions; always saved as Draft

## Stack
- Next.js App Router + TypeScript
- Prisma ORM
- SQLite for local dev (switchable to Postgres in production by env)
- NextAuth credentials provider

## Local run
1. Install deps:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client + run migration + seed:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```
4. Run dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`

### Seed logins
- Admin: `admin@moat.local` / `Admin123!`
- Manager: `manager@moat.local` / `Manager123!`
- Learner: `learner1@moat.local` / `Learner123!`

## Tests
Quiz scoring + attempt-limit unit tests:
```bash
npm test
```

## Notes
- AI Content Studio intentionally uses local deterministic generation in this starter to keep personal data out of external prompts.
- For Postgres deployment, set:
  - `DATABASE_PROVIDER="postgresql"`
  - `DATABASE_URL="postgresql://..."`

## Draft policy course after seed
- Run seed, then sign in as Admin, open `/admin`, and go to **Draft Course Editing and Publishing**.
- Find `IT Access Control, MOAT` in Draft state.
- Review and edit module lesson text and quiz questions as needed.
- Set **Course status** to `PUBLISHED` and save to publish.
