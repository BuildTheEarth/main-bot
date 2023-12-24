import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"

@typeorm.Entity({ name: "command_action" })
export default class CommandAction extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ nullable: false })
    command!: string

    @typeorm.Column({ nullable: true })
    subcommandGroup?: string

    @typeorm.Column({ nullable: true })
    subcommand?: string

    @SnowflakeColumn({ nullable: false })
    executor!: string

    @SnowflakeColumn({ nullable: false })
    guild!: string

    @SnowflakeColumn({ nullable: false })
    channel!: string

    @typeorm.CreateDateColumn({ nullable: false })
    created!: Date
}
