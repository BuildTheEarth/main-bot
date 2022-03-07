import typeorm from "typeorm"

export class AddReminders1624421039931 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable("reminders")
        if (!exists)
            await queryRunner.query(`
            CREATE TABLE \`reminders\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`channel\` varchar(18) NOT NULL,
                \`message\` varchar(1024) NOT NULL,
                \`interval\` int(11) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT current_timestamp(6),
                \`cancelled\` tinyint(4) NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `)
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.dropTable("reminders", true)
    }
}
