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
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import fecha from "fecha"
import Discord from "discord.js"
import Client from "../struct/Client"
import TimedPunishment from "./TimedPunishment"
import formatPunishmentTime from "../util/formatPunishmentTime"

export type Action = "warn" | "mute" | "kick" | "ban" | "unmute" | "unban"

@Entity({ name: "action_logs" })
export default class ActionLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    action: Action

    @SnowflakeColumn()
    member: string

    @SnowflakeColumn()
    executor: string

    @Column({ length: 500 })
    reason: string

    @Column({ nullable: true })
    length?: number

    @SnowflakeColumn()
    channel: string

    @SnowflakeColumn()
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
    @JoinColumn({ name: "punishment_id" })
    punishment?: TimedPunishment

    get old(): boolean {
        const difference = Date.now() - this.createdAt.getTime()
        const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000
        return difference > threeMonths
    }

    format(): string {
        let formatted = `\` ${this.id}. \` ${this.reason}`
        if (this.old) formatted = `\\📜 ${formatted}`
        return formatted
    }

    displayEmbed(client: Client): Discord.MessageEmbedOptions {
        const messageLink = `https://discord.com/channels/${client.config.guilds.main}/${this.channel}/${this.message}`
        const utcOffset = this.createdAt.getTimezoneOffset() * 60000
        const utc = new Date(this.createdAt.getTime() + utcOffset)
        const timestamp = fecha.format(utc, "DD/MM/YY [@] hh:mm:ss UTC")
        const length = this.length ? formatPunishmentTime(this.length, true) : "\u200B"
        const embed: Discord.MessageEmbedOptions = {
            color: client.config.colors.success,
            author: { name: `Case #${this.id} (${this.action})` },
            thumbnail: { url: client.config.assets.cases[this.action] },
            fields: [
                { name: "Member", value: `<@${this.member}>` },
                { name: this.length ? "Length" : "\u200B", value: length },
                { name: "Reason", value: this.reason },
                { name: "Moderator", value: `<@${this.executor}>` },
                { name: "Context", value: `[Link](${messageLink})` },
                { name: "Time", value: timestamp }
            ].map(field => ({ ...field, inline: true }))
        }

        if (this.deletedAt) {
            embed.description = "*This case has been deleted.*"
            embed.color = client.config.colors.error
        }

        if (this.punishment?.end > new Date()) {
            const end = this.punishment.end.getTime() - Date.now()
            embed.description = `*Ending in ${formatPunishmentTime(end, true)}.*`
        }

        return embed
    }
}
