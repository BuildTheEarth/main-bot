import { MigrationInterface, QueryRunner } from "typeorm"

export class AddBannerImages1611627842518 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable("banner_images")))
            await queryRunner.query(`
CREATE TABLE \`banner_images\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`url\` varchar(255) NOT NULL,
    \`builders\` text NOT NULL,
    \`location\` varchar(255) NOT NULL,
    \`description\` varchar(255) DEFAULT NULL,
    \`deleted_at\` datetime(6) DEFAULT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("banner_images", true)
    }
}
