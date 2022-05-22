import typeorm from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import unicode from "./transformers/unicode.transformer.js"

@typeorm.Entity({ name: "moderation_notes" })
export default class ModerationNote extends typeorm.BaseEntity {
    @SnowflakePrimaryColumn()
    member!: string

    @typeorm.Column({ length: 1024, transformer: unicode })
    body!: string

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @typeorm.UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @typeorm.Column("simple-array")
    updaters!: string[]
}
