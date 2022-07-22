import {MigrationInterface, QueryRunner} from "typeorm";

export class Snowflake191658511516690 implements MigrationInterface {
    name = 'Snowflake191658511516690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_banned_words" ("word" varchar(19) PRIMARY KEY NOT NULL, "punishment_type" varchar, "reason" varchar(1024), "duration" integer, "exception" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_banned_words"("word", "punishment_type", "reason", "duration", "exception") SELECT "word", "punishment_type", "reason", "duration", "exception" FROM "banned_words"`);
        await queryRunner.query(`DROP TABLE "banned_words"`);
        await queryRunner.query(`ALTER TABLE "temporary_banned_words" RENAME TO "banned_words"`);
        await queryRunner.query(`CREATE TABLE "temporary_blunder_tracker" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "description" varchar NOT NULL, "role" varchar(19), "last_blunder" date, "message" varchar(19) NOT NULL, "channel" varchar(19) NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_blunder_tracker"("id", "description", "role", "last_blunder", "message", "channel") SELECT "id", "description", "role", "last_blunder", "message", "channel" FROM "blunder_tracker"`);
        await queryRunner.query(`DROP TABLE "blunder_tracker"`);
        await queryRunner.query(`ALTER TABLE "temporary_blunder_tracker" RENAME TO "blunder_tracker"`);
        await queryRunner.query(`CREATE TABLE "temporary_moderation_notes" ("member" varchar(19) PRIMARY KEY NOT NULL, "body" varchar(1024) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "updaters" text NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_moderation_notes"("member", "body", "created_at", "updated_at", "updaters") SELECT "member", "body", "created_at", "updated_at", "updaters" FROM "moderation_notes"`);
        await queryRunner.query(`DROP TABLE "moderation_notes"`);
        await queryRunner.query(`ALTER TABLE "temporary_moderation_notes" RENAME TO "moderation_notes"`);
        await queryRunner.query(`CREATE TABLE "temporary_suggestions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" integer, "extends" integer, "author" varchar(19) NOT NULL, "anonymous" boolean NOT NULL, "title" varchar NOT NULL, "body" varchar(2048) NOT NULL, "teams" varchar, "status" varchar, "status_updater" varchar(19), "status_reason" varchar(1024), "message" varchar(19) NOT NULL, "thread" varchar(19), "staff" boolean NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "deleter" varchar(19))`);
        await queryRunner.query(`INSERT INTO "temporary_suggestions"("id", "number", "extends", "author", "anonymous", "title", "body", "teams", "status", "status_updater", "status_reason", "message", "thread", "staff", "created_at", "deleted_at", "deleter") SELECT "id", "number", "extends", "author", "anonymous", "title", "body", "teams", "status", "status_updater", "status_reason", "message", "thread", "staff", "created_at", "deleted_at", "deleter" FROM "suggestions"`);
        await queryRunner.query(`DROP TABLE "suggestions"`);
        await queryRunner.query(`ALTER TABLE "temporary_suggestions" RENAME TO "suggestions"`);
        await queryRunner.query(`CREATE TABLE "temporary_tasks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" varchar(2048) NOT NULL, "creator" varchar(19) NOT NULL, "assignees" text NOT NULL, "status" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_tasks"("id", "title", "description", "creator", "assignees", "status") SELECT "id", "title", "description", "creator", "assignees", "status" FROM "tasks"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`ALTER TABLE "temporary_tasks" RENAME TO "tasks"`);
        await queryRunner.query(`CREATE TABLE "temporary_teampoint_permissions" ("roleId" varchar(19) PRIMARY KEY NOT NULL, "maxPoints" float NOT NULL DEFAULT (0), "minPoints" float NOT NULL DEFAULT (0), "maxUsagesPerDay" integer NOT NULL DEFAULT (10))`);
        await queryRunner.query(`INSERT INTO "temporary_teampoint_permissions"("roleId", "maxPoints", "minPoints", "maxUsagesPerDay") SELECT "roleId", "maxPoints", "minPoints", "maxUsagesPerDay" FROM "teampoint_permissions"`);
        await queryRunner.query(`DROP TABLE "teampoint_permissions"`);
        await queryRunner.query(`ALTER TABLE "temporary_teampoint_permissions" RENAME TO "teampoint_permissions"`);
        await queryRunner.query(`CREATE TABLE "temporary_suspicious_users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" varchar(19) NOT NULL, "submitterId" varchar(19) NOT NULL, "messageId" varchar(19) NOT NULL, "denied" boolean NOT NULL DEFAULT (0), "approved" boolean NOT NULL DEFAULT (0), "moderatorId" varchar(19), "reason" text, "evidence" text NOT NULL, "deletedAt" datetime, "threadId" varchar(19))`);
        await queryRunner.query(`INSERT INTO "temporary_suspicious_users"("id", "userId", "submitterId", "messageId", "denied", "approved", "moderatorId", "reason", "evidence", "deletedAt", "threadId") SELECT "id", "userId", "submitterId", "messageId", "denied", "approved", "moderatorId", "reason", "evidence", "deletedAt", "threadId" FROM "suspicious_users"`);
        await queryRunner.query(`DROP TABLE "suspicious_users"`);
        await queryRunner.query(`ALTER TABLE "temporary_suspicious_users" RENAME TO "suspicious_users"`);
        await queryRunner.query(`CREATE TABLE "temporary_teampoint_users" ("userId" varchar(19) PRIMARY KEY NOT NULL, "commandUsagesToday" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "temporary_teampoint_users"("userId", "commandUsagesToday") SELECT "userId", "commandUsagesToday" FROM "teampoint_users"`);
        await queryRunner.query(`DROP TABLE "teampoint_users"`);
        await queryRunner.query(`ALTER TABLE "temporary_teampoint_users" RENAME TO "teampoint_users"`);
        await queryRunner.query(`CREATE TABLE "temporary_timed_punishments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "member" varchar(19) NOT NULL, "type" varchar NOT NULL, "length" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_timed_punishments"("id", "member", "type", "length", "created_at") SELECT "id", "member", "type", "length", "created_at" FROM "timed_punishments"`);
        await queryRunner.query(`DROP TABLE "timed_punishments"`);
        await queryRunner.query(`ALTER TABLE "temporary_timed_punishments" RENAME TO "timed_punishments"`);
        await queryRunner.query(`CREATE TABLE "temporary_reminders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channel" varchar(19) NOT NULL, "message" varchar(1024) NOT NULL, "interval" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "next_fire_date" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_reminders"("id", "channel", "message", "interval", "created_at", "next_fire_date") SELECT "id", "channel", "message", "interval", "created_at", "next_fire_date" FROM "reminders"`);
        await queryRunner.query(`DROP TABLE "reminders"`);
        await queryRunner.query(`ALTER TABLE "temporary_reminders" RENAME TO "reminders"`);
        await queryRunner.query(`CREATE TABLE "temporary_advanced_builders" ("builder" varchar(19) PRIMARY KEY NOT NULL, "given_at" datetime NOT NULL DEFAULT (datetime('now')), "role_name" varchar NOT NULL DEFAULT ('ADVANCED_BUILDER'))`);
        await queryRunner.query(`INSERT INTO "temporary_advanced_builders"("builder", "given_at", "role_name") SELECT "builder", "given_at", "role_name" FROM "advanced_builders"`);
        await queryRunner.query(`DROP TABLE "advanced_builders"`);
        await queryRunner.query(`ALTER TABLE "temporary_advanced_builders" RENAME TO "advanced_builders"`);
        await queryRunner.query(`CREATE TABLE "temporary_action_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "member" varchar(19) NOT NULL, "executor" varchar(19) NOT NULL, "reason" varchar(1024) NOT NULL, "reason_image" varchar, "length" integer, "channel" varchar(19) NOT NULL, "message" varchar(19) NOT NULL, "notification" varchar(19), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "deleter" varchar(19), "delete_reason" varchar(1024), "punishment_id" integer, CONSTRAINT "REL_1b2ce2a6f60a2cea07c0c73e9a" UNIQUE ("punishment_id"), CONSTRAINT "FK_1b2ce2a6f60a2cea07c0c73e9a0" FOREIGN KEY ("punishment_id") REFERENCES "timed_punishments" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_action_logs"("id", "action", "member", "executor", "reason", "reason_image", "length", "channel", "message", "notification", "created_at", "deleted_at", "deleter", "delete_reason", "punishment_id") SELECT "id", "action", "member", "executor", "reason", "reason_image", "length", "channel", "message", "notification", "created_at", "deleted_at", "deleter", "delete_reason", "punishment_id" FROM "action_logs"`);
        await queryRunner.query(`DROP TABLE "action_logs"`);
        await queryRunner.query(`ALTER TABLE "temporary_action_logs" RENAME TO "action_logs"`);
        await queryRunner.query(`CREATE TABLE "temporary_moderation_menus" ("member" varchar(19) PRIMARY KEY NOT NULL, "message" varchar(19) NOT NULL, "message_text" varchar(2000) NOT NULL, "punishments" text NOT NULL, "offenses" integer NOT NULL, "current_word" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_moderation_menus"("member", "message", "message_text", "punishments", "offenses", "current_word") SELECT "member", "message", "message_text", "punishments", "offenses", "current_word" FROM "moderation_menus"`);
        await queryRunner.query(`DROP TABLE "moderation_menus"`);
        await queryRunner.query(`ALTER TABLE "temporary_moderation_menus" RENAME TO "moderation_menus"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "moderation_menus" RENAME TO "temporary_moderation_menus"`);
        await queryRunner.query(`CREATE TABLE "moderation_menus" ("member" varchar(18) PRIMARY KEY NOT NULL, "message" varchar(18) NOT NULL, "message_text" varchar(2000) NOT NULL, "punishments" text NOT NULL, "offenses" integer NOT NULL, "current_word" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "moderation_menus"("member", "message", "message_text", "punishments", "offenses", "current_word") SELECT "member", "message", "message_text", "punishments", "offenses", "current_word" FROM "temporary_moderation_menus"`);
        await queryRunner.query(`DROP TABLE "temporary_moderation_menus"`);
        await queryRunner.query(`ALTER TABLE "action_logs" RENAME TO "temporary_action_logs"`);
        await queryRunner.query(`CREATE TABLE "action_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "member" varchar(18) NOT NULL, "executor" varchar(18) NOT NULL, "reason" varchar(1024) NOT NULL, "reason_image" varchar, "length" integer, "channel" varchar(18) NOT NULL, "message" varchar(18) NOT NULL, "notification" varchar(18), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "deleter" varchar(18), "delete_reason" varchar(1024), "punishment_id" integer, CONSTRAINT "REL_1b2ce2a6f60a2cea07c0c73e9a" UNIQUE ("punishment_id"), CONSTRAINT "FK_1b2ce2a6f60a2cea07c0c73e9a0" FOREIGN KEY ("punishment_id") REFERENCES "timed_punishments" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "action_logs"("id", "action", "member", "executor", "reason", "reason_image", "length", "channel", "message", "notification", "created_at", "deleted_at", "deleter", "delete_reason", "punishment_id") SELECT "id", "action", "member", "executor", "reason", "reason_image", "length", "channel", "message", "notification", "created_at", "deleted_at", "deleter", "delete_reason", "punishment_id" FROM "temporary_action_logs"`);
        await queryRunner.query(`DROP TABLE "temporary_action_logs"`);
        await queryRunner.query(`ALTER TABLE "advanced_builders" RENAME TO "temporary_advanced_builders"`);
        await queryRunner.query(`CREATE TABLE "advanced_builders" ("builder" varchar(18) PRIMARY KEY NOT NULL, "given_at" datetime NOT NULL DEFAULT (datetime('now')), "role_name" varchar NOT NULL DEFAULT ('ADVANCED_BUILDER'))`);
        await queryRunner.query(`INSERT INTO "advanced_builders"("builder", "given_at", "role_name") SELECT "builder", "given_at", "role_name" FROM "temporary_advanced_builders"`);
        await queryRunner.query(`DROP TABLE "temporary_advanced_builders"`);
        await queryRunner.query(`ALTER TABLE "reminders" RENAME TO "temporary_reminders"`);
        await queryRunner.query(`CREATE TABLE "reminders" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channel" varchar(18) NOT NULL, "message" varchar(1024) NOT NULL, "interval" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "next_fire_date" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "reminders"("id", "channel", "message", "interval", "created_at", "next_fire_date") SELECT "id", "channel", "message", "interval", "created_at", "next_fire_date" FROM "temporary_reminders"`);
        await queryRunner.query(`DROP TABLE "temporary_reminders"`);
        await queryRunner.query(`ALTER TABLE "timed_punishments" RENAME TO "temporary_timed_punishments"`);
        await queryRunner.query(`CREATE TABLE "timed_punishments" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "member" varchar(18) NOT NULL, "type" varchar NOT NULL, "length" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "timed_punishments"("id", "member", "type", "length", "created_at") SELECT "id", "member", "type", "length", "created_at" FROM "temporary_timed_punishments"`);
        await queryRunner.query(`DROP TABLE "temporary_timed_punishments"`);
        await queryRunner.query(`ALTER TABLE "teampoint_users" RENAME TO "temporary_teampoint_users"`);
        await queryRunner.query(`CREATE TABLE "teampoint_users" ("userId" varchar(18) PRIMARY KEY NOT NULL, "commandUsagesToday" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "teampoint_users"("userId", "commandUsagesToday") SELECT "userId", "commandUsagesToday" FROM "temporary_teampoint_users"`);
        await queryRunner.query(`DROP TABLE "temporary_teampoint_users"`);
        await queryRunner.query(`ALTER TABLE "suspicious_users" RENAME TO "temporary_suspicious_users"`);
        await queryRunner.query(`CREATE TABLE "suspicious_users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" varchar(18) NOT NULL, "submitterId" varchar(18) NOT NULL, "messageId" varchar(18) NOT NULL, "denied" boolean NOT NULL DEFAULT (0), "approved" boolean NOT NULL DEFAULT (0), "moderatorId" varchar(18), "reason" text, "evidence" text NOT NULL, "deletedAt" datetime, "threadId" varchar(18))`);
        await queryRunner.query(`INSERT INTO "suspicious_users"("id", "userId", "submitterId", "messageId", "denied", "approved", "moderatorId", "reason", "evidence", "deletedAt", "threadId") SELECT "id", "userId", "submitterId", "messageId", "denied", "approved", "moderatorId", "reason", "evidence", "deletedAt", "threadId" FROM "temporary_suspicious_users"`);
        await queryRunner.query(`DROP TABLE "temporary_suspicious_users"`);
        await queryRunner.query(`ALTER TABLE "teampoint_permissions" RENAME TO "temporary_teampoint_permissions"`);
        await queryRunner.query(`CREATE TABLE "teampoint_permissions" ("roleId" varchar(18) PRIMARY KEY NOT NULL, "maxPoints" float NOT NULL DEFAULT (0), "minPoints" float NOT NULL DEFAULT (0), "maxUsagesPerDay" integer NOT NULL DEFAULT (10))`);
        await queryRunner.query(`INSERT INTO "teampoint_permissions"("roleId", "maxPoints", "minPoints", "maxUsagesPerDay") SELECT "roleId", "maxPoints", "minPoints", "maxUsagesPerDay" FROM "temporary_teampoint_permissions"`);
        await queryRunner.query(`DROP TABLE "temporary_teampoint_permissions"`);
        await queryRunner.query(`ALTER TABLE "tasks" RENAME TO "temporary_tasks"`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" varchar(2048) NOT NULL, "creator" varchar(18) NOT NULL, "assignees" text NOT NULL, "status" varchar)`);
        await queryRunner.query(`INSERT INTO "tasks"("id", "title", "description", "creator", "assignees", "status") SELECT "id", "title", "description", "creator", "assignees", "status" FROM "temporary_tasks"`);
        await queryRunner.query(`DROP TABLE "temporary_tasks"`);
        await queryRunner.query(`ALTER TABLE "suggestions" RENAME TO "temporary_suggestions"`);
        await queryRunner.query(`CREATE TABLE "suggestions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" integer, "extends" integer, "author" varchar(18) NOT NULL, "anonymous" boolean NOT NULL, "title" varchar NOT NULL, "body" varchar(2048) NOT NULL, "teams" varchar, "status" varchar, "status_updater" varchar(18), "status_reason" varchar(1024), "message" varchar(18) NOT NULL, "thread" varchar(18), "staff" boolean NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "deleted_at" datetime, "deleter" varchar(18))`);
        await queryRunner.query(`INSERT INTO "suggestions"("id", "number", "extends", "author", "anonymous", "title", "body", "teams", "status", "status_updater", "status_reason", "message", "thread", "staff", "created_at", "deleted_at", "deleter") SELECT "id", "number", "extends", "author", "anonymous", "title", "body", "teams", "status", "status_updater", "status_reason", "message", "thread", "staff", "created_at", "deleted_at", "deleter" FROM "temporary_suggestions"`);
        await queryRunner.query(`DROP TABLE "temporary_suggestions"`);
        await queryRunner.query(`ALTER TABLE "moderation_notes" RENAME TO "temporary_moderation_notes"`);
        await queryRunner.query(`CREATE TABLE "moderation_notes" ("member" varchar(18) PRIMARY KEY NOT NULL, "body" varchar(1024) NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "updaters" text NOT NULL)`);
        await queryRunner.query(`INSERT INTO "moderation_notes"("member", "body", "created_at", "updated_at", "updaters") SELECT "member", "body", "created_at", "updated_at", "updaters" FROM "temporary_moderation_notes"`);
        await queryRunner.query(`DROP TABLE "temporary_moderation_notes"`);
        await queryRunner.query(`ALTER TABLE "blunder_tracker" RENAME TO "temporary_blunder_tracker"`);
        await queryRunner.query(`CREATE TABLE "blunder_tracker" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "description" varchar NOT NULL, "role" varchar(18), "last_blunder" date, "message" varchar(18) NOT NULL, "channel" varchar(18) NOT NULL)`);
        await queryRunner.query(`INSERT INTO "blunder_tracker"("id", "description", "role", "last_blunder", "message", "channel") SELECT "id", "description", "role", "last_blunder", "message", "channel" FROM "temporary_blunder_tracker"`);
        await queryRunner.query(`DROP TABLE "temporary_blunder_tracker"`);
        await queryRunner.query(`ALTER TABLE "banned_words" RENAME TO "temporary_banned_words"`);
        await queryRunner.query(`CREATE TABLE "banned_words" ("word" varchar(18) PRIMARY KEY NOT NULL, "punishment_type" varchar, "reason" varchar(1024), "duration" integer, "exception" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "banned_words"("word", "punishment_type", "reason", "duration", "exception") SELECT "word", "punishment_type", "reason", "duration", "exception" FROM "temporary_banned_words"`);
        await queryRunner.query(`DROP TABLE "temporary_banned_words"`);
    }

}
