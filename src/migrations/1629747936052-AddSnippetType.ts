import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSnippetType1629747936052 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query("ALTER TABLE Snippets ADD 'type' VARCHAR NOT NULL DEFAULT 'snippet'")
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query("ALTER TABLE Snippets DROP type") // Not even going to bother making this work with sqlite
    }

}
