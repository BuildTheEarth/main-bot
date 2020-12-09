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
import fecha from "fecha"
import Discord from "discord.js"
import TextChannel from "../struct/discord/TextChannel"
import TimedPunishment from "./TimedPunishment"
import formatPunishmentTime from "../util/formatPunishmentTime"

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

    format(): string {
        let formatted = `\` ${this.id}. \` ${this.reason}`
        if (this.deletedAt) formatted = `~~${formatted}~~`
        return formatted
    }

    async send(channel: TextChannel): Promise<Discord.Message> {
        const messageLink = `https://discord.com/channels/${channel.client.config.guilds.main}/${this.channel}/${this.message}`
        const utcOffset = this.createdAt.getTimezoneOffset() * 60000
        const utc = new Date(this.createdAt.getTime() + utcOffset)
        const timestamp = fecha.format(utc, "DD/MM/YY [@] hh:mm:ss UTC")
        const length = this.length ? formatPunishmentTime(this.length, true) : "\u200B"
        const embed: Discord.MessageEmbedOptions = {
            author: { name: `Case #${this.id} (${this.action})` },
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
            return await channel.sendError(embed)
        }

        if (this.punishment?.end > new Date()) {
            const end = this.punishment.end.getTime() - Date.now()
            embed.description = `*Ending in ${formatPunishmentTime(end, true)}.*`
        }

        return await channel.sendSuccess(embed)
    }
}
