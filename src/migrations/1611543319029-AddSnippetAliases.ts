import { MigrationInterface, QueryRunner } from "typeorm"

export class AddSnippetAliases1611543319029 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("snippets", "aliases")))
            await queryRunner.query("ALTER TABLE snippets ADD aliases text NOT NULL")
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE snippets DROP COLUMN aliases")
    }
}
