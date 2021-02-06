import { MigrationInterface, QueryRunner } from "typeorm"

export class AddActionLogNotification1612568957006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("action_logs", "notification")))
            await queryRunner.query(
                "ALTER TABLE action_logs ADD COLUMN notification varchar(18) DEFAULT NULL AFTER message"
            )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE action_logs DROP COLUMN notification")
    }
}
