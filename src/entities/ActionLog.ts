import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    OneToOne,
    JoinColumn
} from "typeorm"
import TimedPunishment from "./TimedPunishment"

export type Action = "warn" | "mute" | "kick" | "ban" | "unmute" | "unban"

@Entity({ name: "action_logs" })
export default class ActionLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    action: Action

    @Column({ length: 18 })
    member: string

    @Column({ length: 18 })
    executor: string

    @Column({ length: 500 })
    reason: string

    @Column({ nullable: true })
    length?: number

    @Column({ length: 18 })
    channel: string

    @Column({ length: 18 })
    message: string

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date

    @OneToOne(() => TimedPunishment, {
        nullable: true,
        eager: true,
        onDelete: "SET NULL",
        cascade: true
    })
    @JoinColumn()
    punishment?: TimedPunishment
}
