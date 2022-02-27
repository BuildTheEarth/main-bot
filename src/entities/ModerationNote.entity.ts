import { Entity, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator"

@Entity({ name: "moderation_notes" })
export default class ModerationNote extends BaseEntity {
    @SnowflakePrimaryColumn()
    member: string

    @Column({ length: 1024 })
    body: string

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date

    @Column("simple-array")
    updaters: string[]
}
