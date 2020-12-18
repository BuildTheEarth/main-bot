import { MigrationInterface, QueryRunner } from "typeorm"

export class AddModerationNotes1608254163012 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable("moderation_notes")
        if (!exists)
            await queryRunner.query(`
CREATE TABLE \`moderation_notes\` (
    \`member\` varchar(18) NOT NULL,
    \`body\` varchar(1024) NOT NULL,
    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    \`updaters\` text NOT NULL,
    PRIMARY KEY (\`member\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("moderation_notes", true)
    }
}
