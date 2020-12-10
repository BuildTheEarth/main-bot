import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BaseEntity
} from "typeorm"

@Entity({ name: "suggestions" })
export default class Suggestion extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 18 })
    author: string

    @Column({ length: 2048 })
    body: string

    @Column({ length: 18 })
    message: string

    @Column()
    status: "approved" | "rejected" | "forwarded" | "in-progress" | "information"

    @Column()
    staff: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date
}
