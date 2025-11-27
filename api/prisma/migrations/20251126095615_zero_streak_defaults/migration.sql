-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dailyStreakReward" INTEGER NOT NULL DEFAULT 0,
    "weeklyStreakReward" INTEGER NOT NULL DEFAULT 0,
    "monthlyStreakReward" INTEGER NOT NULL DEFAULT 0,
    "yearlyStreakReward" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC'
);
INSERT INTO "new_Family" ("createdAt", "dailyStreakReward", "id", "monthlyStreakReward", "name", "timezone", "updatedAt", "weeklyStreakReward", "yearlyStreakReward") SELECT "createdAt", "dailyStreakReward", "id", "monthlyStreakReward", "name", "timezone", "updatedAt", "weeklyStreakReward", "yearlyStreakReward" FROM "Family";
DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
