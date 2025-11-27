-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "reminderStyle" TEXT NOT NULL DEFAULT 'FRIENDLY',
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "daysOfWeek" JSONB,
    "points" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "routineTemplateId" TEXT,
    CONSTRAINT "Task_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_routineTemplateId_fkey" FOREIGN KEY ("routineTemplateId") REFERENCES "RoutineTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("active", "createdAt", "createdById", "daysOfWeek", "description", "familyId", "frequency", "icon", "id", "points", "reminderStyle", "routineTemplateId", "title", "updatedAt") SELECT "active", "createdAt", "createdById", "daysOfWeek", "description", "familyId", "frequency", "icon", "id", "points", "reminderStyle", "routineTemplateId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

