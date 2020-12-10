import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BaseEntity
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"

@Entity({ name: "suggestions" })
export default class Suggestion extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    author: string

    @Column({ length: 2048 })
    body: string

    @SnowflakeColumn()
    message: string

    @Column()
    status: "approved" | "rejected" | "forwarded" | "in-progress" | "information"

    @Column()
    staff: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date
}
