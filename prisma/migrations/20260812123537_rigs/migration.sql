/*
  Warnings:

  - You are about to drop the column `rigCount` on the `EventConfig` table. All the data in the column will be lost.
  - You are about to drop the column `partySize` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `bookedCount` on the `Slot` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Slot` table. All the data in the column will be lost.
  - Added the required column `rigId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Rig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "slotMinutes" INTEGER NOT NULL DEFAULT 10,
    "eventDates" TEXT NOT NULL DEFAULT '',
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '17:00'
);
INSERT INTO "new_EventConfig" ("closeTime", "eventDates", "id", "openTime", "slotMinutes") SELECT "closeTime", "eventDates", "id", "openTime", "slotMinutes" FROM "EventConfig";
DROP TABLE "EventConfig";
ALTER TABLE "new_EventConfig" RENAME TO "EventConfig";
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "rigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "Rig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkedInAt", "code", "createdAt", "grade", "id", "name", "slotId", "status") SELECT "checkedInAt", "code", "createdAt", "grade", "id", "name", "slotId", "status" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");
CREATE INDEX "Reservation_slotId_idx" ON "Reservation"("slotId");
CREATE INDEX "Reservation_rigId_idx" ON "Reservation"("rigId");
CREATE TABLE "new_Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Slot" ("date", "endTime", "id", "isOpen", "startTime") SELECT "date", "endTime", "id", "isOpen", "startTime" FROM "Slot";
DROP TABLE "Slot";
ALTER TABLE "new_Slot" RENAME TO "Slot";
CREATE INDEX "Slot_date_idx" ON "Slot"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
