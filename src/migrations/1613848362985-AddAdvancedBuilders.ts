import { MigrationInterface, QueryRunner } from "typeorm"

export class AddAdvancedBuilders1613848362985 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable("advanced_builders")
        if (!exists)
            await queryRunner.query(`
CREATE TABLE \`advanced_builders\` (
    \`builder\` varchar(18) NOT NULL,
    \`given_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (\`builder\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("advanced_builders")
    }
}
