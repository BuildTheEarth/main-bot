import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BaseEntity
} from "typeorm"

@Entity()
export default class ActionLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    action: "warn" | "mute" | "kick" | "ban" | "unmute" | "unban"

    @Column({ length: 18 })
    member: string

    @Column({ length: 18 })
    executor: string

    @Column({ length: 500 })
    reason: string

    @Column({ nullable: true })
    length: number

    @CreateDateColumn()
    timestamp: Date

    @Column({ length: 18 })
    channel: string

    @Column({ length: 18 })
    message: string
}
