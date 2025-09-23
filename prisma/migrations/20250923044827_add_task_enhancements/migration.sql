-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "category" TEXT,
ADD COLUMN     "estimatedTime" INTEGER,
ADD COLUMN     "reminders" JSONB,
ADD COLUMN     "tags" TEXT[];

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "public"."tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_tags_idx" ON "public"."tasks"("tags");
