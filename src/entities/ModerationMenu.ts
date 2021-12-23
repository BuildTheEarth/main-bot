import Discord from "discord.js"
import { Entity, Column, BaseEntity } from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn"

@Entity({ name: "moderation_menus" })
export default class ModerationMenu extends BaseEntity {
    public static async createMenu(message: Discord.Message): Promise<ModerationMenu> {
        const modMenu = new ModerationMenu()
        modMenu.message = message.id
        modMenu.member = message.member.id
        // eslint-disable-next-line no-useless-escape
        modMenu.message_text = message.content
        await message.delete()
        return modMenu
    }
    @SnowflakePrimaryColumn()
    member: string

    @SnowflakeColumn()
    message: string

    @Column({ length: 2000 })
    message_text: string

    @Column({ type: "simple-array" })
    punishment_types: ("BAN" | "WARN" | "MUTE" | "KICK")[]

    @Column({ length: 1024 })
    reason: string

    @Column({ nullable: true })
    duration: number

    @Column()
    offenses: number
}
