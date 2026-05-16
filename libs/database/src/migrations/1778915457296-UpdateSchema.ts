import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1778915457296 implements MigrationInterface {
    name = 'UpdateSchema1778915457296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_incidents_monitor"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_incidents_project"`);
        await queryRunner.query(`ALTER TABLE "monitors" DROP CONSTRAINT "FK_monitors_project"`);
        await queryRunner.query(`ALTER TABLE "alert_channels" DROP CONSTRAINT "FK_alert_channels_project"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_incidents_monitor_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_incidents_project_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_monitors_project_id_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_alert_channels_project_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_projects_user_id"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "apiKeyHash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "UQ_f63e2be2a1f3f36aeb21b4fdaaa" UNIQUE ("apiKeyHash")`);
        await queryRunner.query(`COMMENT ON COLUMN "projects"."apiKeyHash" IS 'SHA-256 hash of apiKey for secure lookup'`);
        await queryRunner.query(`ALTER TYPE "public"."monitors_current_status_enum" RENAME TO "monitors_current_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."monitors_currentstatus_enum" AS ENUM('UP', 'DOWN', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" TYPE "public"."monitors_currentstatus_enum" USING "currentStatus"::"text"::"public"."monitors_currentstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."monitors_current_status_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "projects"."githubRepo" IS 'owner/repo format'`);
        await queryRunner.query(`COMMENT ON COLUMN "users"."githubAccessToken" IS 'AES-256 encrypted'`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_77c92898211e6e84f9577380481" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_b59253407df1320b7abadc3d4dd" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "monitors" ADD CONSTRAINT "FK_25ac3340e29d990a04521458b30" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_channels" ADD CONSTRAINT "FK_bed2d0db005987bfb1e2455f353" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_361a53ae58ef7034adc3c06f09f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_361a53ae58ef7034adc3c06f09f"`);
        await queryRunner.query(`ALTER TABLE "alert_channels" DROP CONSTRAINT "FK_bed2d0db005987bfb1e2455f353"`);
        await queryRunner.query(`ALTER TABLE "monitors" DROP CONSTRAINT "FK_25ac3340e29d990a04521458b30"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_b59253407df1320b7abadc3d4dd"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_77c92898211e6e84f9577380481"`);
        await queryRunner.query(`COMMENT ON COLUMN "users"."githubAccessToken" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "projects"."githubRepo" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."monitors_current_status_enum_old" AS ENUM('UP', 'DOWN', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" TYPE "public"."monitors_current_status_enum_old" USING "currentStatus"::"text"::"public"."monitors_current_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "monitors" ALTER COLUMN "currentStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."monitors_currentstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."monitors_current_status_enum_old" RENAME TO "monitors_current_status_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "projects"."apiKeyHash" IS 'SHA-256 hash of apiKey for secure lookup'`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "UQ_f63e2be2a1f3f36aeb21b4fdaaa"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "apiKeyHash"`);
        await queryRunner.query(`CREATE INDEX "idx_projects_user_id" ON "projects" ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_alert_channels_project_active" ON "alert_channels" ("projectId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_monitors_project_id_active" ON "monitors" ("projectId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_incidents_project_created" ON "incidents" ("createdAt", "projectId") `);
        await queryRunner.query(`CREATE INDEX "idx_incidents_monitor_status" ON "incidents" ("monitorId", "status") `);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_channels" ADD CONSTRAINT "FK_alert_channels_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "monitors" ADD CONSTRAINT "FK_monitors_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_incidents_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_incidents_monitor" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
