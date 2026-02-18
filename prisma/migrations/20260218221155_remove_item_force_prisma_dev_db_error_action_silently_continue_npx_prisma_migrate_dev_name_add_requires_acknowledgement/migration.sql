-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quizRequirement" TEXT NOT NULL DEFAULT 'OFF',
    "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "passMarkPercent" INTEGER,
    "maxQuizAttempts" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Course" ("createdAt", "description", "id", "maxQuizAttempts", "passMarkPercent", "quizRequirement", "status", "title", "updatedAt") SELECT "createdAt", "description", "id", "maxQuizAttempts", "passMarkPercent", "quizRequirement", "status", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
