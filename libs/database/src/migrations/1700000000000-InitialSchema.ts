import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."monitors_type_enum" AS ENUM('http', 'tcp')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."monitors_current_status_enum" AS ENUM('UP', 'DOWN', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_status_enum" AS ENUM('open', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_severity_enum" AS ENUM('critical', 'major', 'minor')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_channels_type_enum" AS ENUM('discord', 'slack', 'webhook')`,
    );

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255),
        "name" varchar(100) NOT NULL,
        "githubUsername" varchar(100),
        "githubAccessToken" text,
        "refreshTokenHash" varchar(255),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        "userId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "githubRepo" varchar(200),
        "apiKey" varchar(64) NOT NULL,
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_projects_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_projects_api_key" UNIQUE ("apiKey"),
        CONSTRAINT "FK_projects_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create monitors table
    await queryRunner.query(`
      CREATE TABLE "monitors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        "projectId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "url" varchar(500) NOT NULL,
        "type" "public"."monitors_type_enum" NOT NULL DEFAULT 'http',
        "intervalSeconds" integer NOT NULL DEFAULT 60,
        "expectedStatus" integer NOT NULL DEFAULT 200,
        "timeoutMs" integer NOT NULL DEFAULT 10000,
        "isActive" boolean NOT NULL DEFAULT true,
        "currentStatus" "public"."monitors_current_status_enum" NOT NULL DEFAULT 'PENDING',
        "lastCheckedAt" timestamptz,
        CONSTRAINT "PK_monitors" PRIMARY KEY ("id"),
        CONSTRAINT "FK_monitors_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    // Create incidents table
    await queryRunner.query(`
      CREATE TABLE "incidents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        "monitorId" uuid NOT NULL,
        "projectId" uuid NOT NULL,
        "status" "public"."incidents_status_enum" NOT NULL DEFAULT 'open',
        "severity" "public"."incidents_severity_enum" NOT NULL DEFAULT 'major',
        "startedAt" timestamptz NOT NULL DEFAULT NOW(),
        "resolvedAt" timestamptz,
        "durationSeconds" integer,
        "aiReport" text,
        "rootCause" text,
        "githubCommits" jsonb,
        "affectedLogs" jsonb,
        CONSTRAINT "PK_incidents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_incidents_monitor" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_incidents_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    // Create alert_channels table
    await queryRunner.query(`
      CREATE TABLE "alert_channels" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        "projectId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "type" "public"."alert_channels_type_enum" NOT NULL,
        "webhookUrl" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_alert_channels" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_channels_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for projects
    await queryRunner.query(
      `CREATE INDEX "idx_projects_user_id" ON "projects"("userId")`,
    );
    // unique indexes are created by UNIQUE constraints

    // Create indexes for monitors
    await queryRunner.query(
      `CREATE INDEX "idx_monitors_project_id_active" ON "monitors"("projectId", "isActive")`,
    );

    // Create indexes for incidents
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_monitor_status" ON "incidents"("monitorId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_project_created" ON "incidents"("projectId", "createdAt" DESC)`,
    );

    // Create indexes for alert_channels
    await queryRunner.query(
      `CREATE INDEX "idx_alert_channels_project_active" ON "alert_channels"("projectId", "isActive")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "alert_channels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "monitors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."alert_channels_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."incidents_severity_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."incidents_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."monitors_current_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."monitors_type_enum"`,
    );
  }
}
