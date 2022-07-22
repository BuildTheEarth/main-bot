import typeorm from "typeorm"

export class AddTasks1608523298876 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable("tasks")
        if (!exists)
            await queryRunner.query(`
CREATE TABLE \`tasks\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`title\` varchar(255) NOT NULL,
    \`description\` varchar(2048) NOT NULL,
    \`assignees\` text NOT NULL,
    \`status\` varchar(255) DEFAULT NULL,
    \`creator\` varchar(18) NOT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.dropTable("tasks", true)
    }
}
