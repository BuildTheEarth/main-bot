import { MigrationInterface, QueryRunner } from "typeorm"

export class SuggestionThread1643001626292 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE suggestions ADD COLUMN thread varchar(18) DEFAULT NULL"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE suggestions DROP COLUMN thread")
    }
}
