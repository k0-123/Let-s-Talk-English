import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_theme" AS ENUM('system', 'light', 'dark');
  CREATE TABLE "assignments" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"student_id" uuid NOT NULL,
  	"question_set_id" uuid NOT NULL,
  	"educator_id" uuid NOT NULL,
  	"note" varchar,
  	"due_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "student_notes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"student_id" uuid NOT NULL,
  	"educator_id" uuid NOT NULL,
  	"body" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_feedback" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"student_id" uuid NOT NULL,
  	"question_set_id" uuid NOT NULL,
  	"question_index" numeric NOT NULL,
  	"question" varchar NOT NULL,
  	"answer_text" varchar NOT NULL,
  	"result" jsonb NOT NULL,
  	"model" varchar,
  	"input_tokens" numeric,
  	"output_tokens" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "weekly_goal" numeric DEFAULT 5;
  ALTER TABLE "users" ADD COLUMN "theme" "enum_users_theme" DEFAULT 'system';
  ALTER TABLE "users" ADD COLUMN "onboarding_dismissed" boolean DEFAULT false;
  ALTER TABLE "practice_logs" ADD COLUMN "confidence" numeric;
  ALTER TABLE "practice_logs" ADD COLUMN "speaking_seconds" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "assignments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "student_notes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_feedback_id" uuid;
  ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assignments" ADD CONSTRAINT "assignments_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assignments" ADD CONSTRAINT "assignments_educator_id_users_id_fk" FOREIGN KEY ("educator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_educator_id_users_id_fk" FOREIGN KEY ("educator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "assignments_student_idx" ON "assignments" USING btree ("student_id");
  CREATE INDEX "assignments_question_set_idx" ON "assignments" USING btree ("question_set_id");
  CREATE INDEX "assignments_educator_idx" ON "assignments" USING btree ("educator_id");
  CREATE INDEX "assignments_updated_at_idx" ON "assignments" USING btree ("updated_at");
  CREATE INDEX "assignments_created_at_idx" ON "assignments" USING btree ("created_at");
  CREATE UNIQUE INDEX "student_questionSet_idx" ON "assignments" USING btree ("student_id","question_set_id");
  CREATE INDEX "student_notes_student_idx" ON "student_notes" USING btree ("student_id");
  CREATE INDEX "student_notes_educator_idx" ON "student_notes" USING btree ("educator_id");
  CREATE INDEX "student_notes_updated_at_idx" ON "student_notes" USING btree ("updated_at");
  CREATE INDEX "student_notes_created_at_idx" ON "student_notes" USING btree ("created_at");
  CREATE INDEX "ai_feedback_student_idx" ON "ai_feedback" USING btree ("student_id");
  CREATE INDEX "ai_feedback_question_set_idx" ON "ai_feedback" USING btree ("question_set_id");
  CREATE INDEX "ai_feedback_updated_at_idx" ON "ai_feedback" USING btree ("updated_at");
  CREATE INDEX "ai_feedback_created_at_idx" ON "ai_feedback" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assignments_fk" FOREIGN KEY ("assignments_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_student_notes_fk" FOREIGN KEY ("student_notes_id") REFERENCES "public"."student_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_feedback_fk" FOREIGN KEY ("ai_feedback_id") REFERENCES "public"."ai_feedback"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("assignments_id");
  CREATE INDEX "payload_locked_documents_rels_student_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("student_notes_id");
  CREATE INDEX "payload_locked_documents_rels_ai_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_feedback_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "student_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_feedback" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "assignments" CASCADE;
  DROP TABLE "student_notes" CASCADE;
  DROP TABLE "ai_feedback" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assignments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_student_notes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_feedback_fk";
  
  DROP INDEX "payload_locked_documents_rels_assignments_id_idx";
  DROP INDEX "payload_locked_documents_rels_student_notes_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_feedback_id_idx";
  ALTER TABLE "users" DROP COLUMN "weekly_goal";
  ALTER TABLE "users" DROP COLUMN "theme";
  ALTER TABLE "users" DROP COLUMN "onboarding_dismissed";
  ALTER TABLE "practice_logs" DROP COLUMN "confidence";
  ALTER TABLE "practice_logs" DROP COLUMN "speaking_seconds";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "assignments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "student_notes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_feedback_id";
  DROP TYPE "public"."enum_users_theme";`)
}
