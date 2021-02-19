import { MigrationInterface, QueryRunner } from "typeorm"

export class UpBannerDescriptionLength1613721811108 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE banner_images MODIFY COLUMN description varchar(512)"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "UPDATE banner_images SET description = CONCAT(SUBSTRING(description, 0, 253), '...') WHERE LENGTH(description) > 256"
        )
        await queryRunner.query(
            "ALTER TABLE banner_images MODIFY COLUMN description varchar(256)"
        )
    }
}
