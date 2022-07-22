import typeorm from "typeorm"

export class SuggestionThread1643001626292 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE suggestions ADD COLUMN thread varchar(18) DEFAULT NULL"
        )
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE suggestions DROP COLUMN thread")
    }
}
