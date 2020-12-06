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

@Entity({ name: "action_logs" })
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
    length?: number

    @Column({ length: 18 })
    channel: string

    @Column({ length: 18 })
    message: string

    @CreateDateColumn()
    createdAt: Date

    @DeleteDateColumn()
    deletedAt: Date

    @OneToOne(() => TimedPunishment, {
        nullable: true,
        eager: true,
        onDelete: "SET NULL",
        cascade: ["insert", "update", "remove", "soft-remove", "recover"]
    })
    @JoinColumn()
    punishment?: TimedPunishment
}
