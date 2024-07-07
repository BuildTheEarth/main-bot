import { TextChannel } from "discord.js"
import typeorm from "typeorm"
import Client from "../struct/Client.js"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import unicode from "./transformers/unicode.transformer.js"
const NO_PLURAL = [
    "staff of the month",
    "the author",
    "carl-bot",
    "dyno",
    "rythm",
    "notactuallyahuman",
    "on leave",
    "public relations",
    "support",
    "hr",
    "staff",
    "bedrock support",
    "bedrock development",
    "bedrock moderation",
    "network staff",
    "moderator of the month",
    "in training",
    "staff events",
    "tickets",
    "support on duty",
    "beans",
    "brainstorming",
    "bte development bot",
    "moderator on duty",
    "build the earth"
]

@typeorm.Entity({ name: "blunder_tracker" })
export default class BlunderTracker extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ transformer: unicode })
    description!: string

    @SnowflakeColumn({ nullable: true })
    role?: string

    @typeorm.Column({ type: "date", name: "last_blunder", nullable: true })
    lastBlunder?: Date

    @SnowflakeColumn()
    message!: string

    @SnowflakeColumn()
    channel!: string

    static async inc(client: Client): Promise<void> {
        for (const count of await this.find()) count.update(client)
    }

    async update(client: Client): Promise<void> {
        const channel = (await client.customGuilds.staff()).channels.cache.get(
            this.channel
        ) as TextChannel
        const message = await channel.messages.fetch(this.message)

        let dayCount
        if (this.lastBlunder)
            dayCount = Math.floor(
                (Date.now() - new Date(this.lastBlunder).getTime()) / 1000 / 60 / 60 / 24
            )
        else dayCount = "countless"

        if (message)
            message.edit(
                `\`${dayCount}\` days since ${await this.roleToTeam(client)} ${
                    this.description
                }`
            )
        else {
            channel
                .send(
                    `\`${dayCount}\` days since ${await this.roleToTeam(client)} ${
                        this.description
                    }`
                )
                .then(msg => (this.message = msg.id))
        }
    }

    async reset(client: Client): Promise<void> {
        this.lastBlunder = new Date()
        await this.save()
        await this.update(client)
    }

    async roleToTeam(client: Client): Promise<string> {
        if (!this.role) return ""
        const role = (await client.customGuilds.staff()).roles.cache.get(this.role)
        if (!role) return ""
        if (NO_PLURAL.includes(role.name.toLowerCase())) return role.name
        if (role.name.toLowerCase().endsWith("team")) return "the " + role.name
        return role.name + "s"
    }
}
