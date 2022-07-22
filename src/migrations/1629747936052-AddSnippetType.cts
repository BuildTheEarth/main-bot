import typeorm from "typeorm"

export class AddSnippetType1629747936052 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        queryRunner.query(
            "ALTER TABLE snippets ADD type VARCHAR(7) NOT NULL DEFAULT 'snippet'"
        )
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        queryRunner.query("ALTER TABLE snippets DROP COLUMN type") // Not even going to bother making this work with sqlite
    }
}
