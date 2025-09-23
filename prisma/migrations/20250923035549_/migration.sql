-- CreateEnum
CREATE TYPE "public"."UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'SUPPORT_TICKET_CREATED', 'CONTACT_MESSAGE_SENT');

-- CreateTable
CREATE TABLE "public"."user_activities" (
    "id" TEXT NOT NULL,
    "type" "public"."UserActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deleted_tasks" (
    "id" TEXT NOT NULL,
    "originalTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_userId_idx" ON "public"."user_activities"("userId");

-- CreateIndex
CREATE INDEX "user_activities_type_idx" ON "public"."user_activities"("type");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "public"."user_activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "deleted_tasks_originalTaskId_key" ON "public"."deleted_tasks"("originalTaskId");

-- CreateIndex
CREATE INDEX "deleted_tasks_userId_idx" ON "public"."deleted_tasks"("userId");

-- CreateIndex
CREATE INDEX "deleted_tasks_deletedAt_idx" ON "public"."deleted_tasks"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deleted_tasks" ADD CONSTRAINT "deleted_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deleted_tasks" ADD CONSTRAINT "deleted_tasks_originalTaskId_fkey" FOREIGN KEY ("originalTaskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
