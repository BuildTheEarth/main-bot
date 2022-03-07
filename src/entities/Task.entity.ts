import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"

export type TaskStatus = keyof typeof TaskStatuses
export enum TaskStatuses {
    "in-progress",
    "abandoned",
    "done",
    "reported",
    "hidden"
}

@typeorm.Entity({ name: "tasks" })
export default class Task extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id: number

    @typeorm.Column()
    title: string

    @typeorm.Column({ length: 2048 })
    description: string

    @SnowflakeColumn()
    creator: string

    @typeorm.Column("simple-array")
    assignees: string[]

    @typeorm.Column({ nullable: true })
    status?: TaskStatus
}
