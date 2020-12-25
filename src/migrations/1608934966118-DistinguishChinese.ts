import { MigrationInterface, QueryRunner } from "typeorm"

// 'zh' and 'cn' were used for simplified and traditional Chinese, respectively
export class DistinguishChinese1608934966118 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable("snippets"))) return

        await queryRunner.query(
            "ALTER TABLE snippets ALTER COLUMN language VARCHAR(4) NOT NULL"
        )
        await queryRunner.query(
            "UPDATE snippets SET language = 'zh-s' WHERE language = 'zh'"
        )
        await queryRunner.query(
            "UPDATE snippets SET language = 'zh-t' WHERE language = 'cn'"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable("snippets"))) return

        await queryRunner.query(
            "UPDATE snippets SET language = 'zh' WHERE language = 'zh-s'"
        )
        await queryRunner.query(
            "UPDATE snippets SET language = 'cn' WHERE language = 'zh-t'"
        )
        await queryRunner.query(
            "ALTER TABLE snippets ALTER COLUMN language VARCHAR(2) NOT NULL"
        )
    }
}
