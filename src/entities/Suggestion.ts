import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BaseEntity
} from "typeorm"

@Entity()
export default class Suggestion extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 18 })
    author: string

    @Column({ length: 2048 })
    body: string

    @CreateDateColumn()
    timestamp: Date

    @Column({ length: 18 })
    message: string

    @Column()
    staff: boolean
}
