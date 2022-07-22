import typeorm from "typeorm"

// data loss time!
export class MakeBannerCreditsPlain1613675796565 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        if (!(await queryRunner.hasColumn("banner_images", "builders"))) return
        await queryRunner.dropColumn("banner_images", "builders")
        await queryRunner.query(
            "ALTER TABLE banner_images ADD COLUMN credit varchar(255) NOT NULL AFTER url"
        )
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.dropColumn("banner_images", "credit")
        await queryRunner.query(
            "ALTER TABLE banner_images ADD COLUMN builders text NOT NULL AFTER url"
        )
    }
}
