import typeorm from "typeorm"

// this isn't really a schema change,
// it just sets the length of non-timed action logs (such as warns)
// to `null` instead of `0`, as that would cause them to display as "permanent"
export class AnnulInapplicableLengths1610943198809 implements typeorm.MigrationInterface {
    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
        await queryRunner.query(
            "UPDATE action_logs SET length = NULL WHERE action NOT IN ('mute', 'ban')"
        )
    }

    public async down(): Promise<void> {
        // ...
    }
}
