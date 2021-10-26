import { MigrationInterface, QueryRunner } from "typeorm"

export class AddSnippetType1629747936052 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(
            "ALTER TABLE snippets ADD type VARCHAR(7) NOT NULL DEFAULT 'snippet'"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query("ALTER TABLE snippets DROP COLUMN type") // Not even going to bother making this work with sqlite
    }
}
