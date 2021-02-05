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
import ms from "ms"
import Discord from "discord.js"
import Client from "../struct/Client"
import TimedPunishment from "./TimedPunishment"
import truncateSting from "../util/truncateString"
import formatPunishmentTime from "../util/formatPunishmentTime"
import formatUTCDate from "../util/formatUTCDate"
import milliseconds from "./transformers/milliseconds"
import past from "../util/pastTense"
import noop from "../util/noop"

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

    @Column({ length: 1024 })
    reason: string

    @Column({ nullable: true, name: "reason_image" })
    reasonImage?: string

    @Column({ nullable: true, transformer: milliseconds })
    length?: number

    @SnowflakeColumn()
    channel: string

    @SnowflakeColumn()
    message: string

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date

    @SnowflakeColumn({ nullable: true })
    deleter?: string

    @Column({ name: "delete_reason", length: 1024, nullable: true })
    deleteReason?: string

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
        let formatted = truncateSting(this.reason, 64, "...")
        if (this.length) formatted = `(**${ms(this.length)}**) ` + formatted
        formatted = `\` ${this.id}. \` ${formatted}`
        if (this.old) formatted = `\\📜 ${formatted}`
        return formatted
    }

    displayEmbed(client: Client): Discord.MessageEmbedOptions {
        const messageLink = `https://discord.com/channels/${client.guilds.main.id}/${this.channel}/${this.message}`
        const length =
            this.length !== null ? formatPunishmentTime(this.length, true) : "\u200B"
        const embed: Discord.MessageEmbedOptions = {
            color: client.config.colors.success,
            author: { name: `Case #${this.id} (${this.action})` },
            thumbnail: { url: client.config.assets.cases[this.action] },
            fields: [
                { name: "Member", value: `<@${this.member}>` },
                { name: this.length !== null ? "Length" : "\u200B", value: length },
                { name: "Reason", value: this.reason },
                { name: "Moderator", value: `<@${this.executor}>` },
                { name: "Context", value: `[Link](${messageLink})` },
                { name: "Time", value: formatUTCDate(this.createdAt) }
            ].map(field => ({ ...field, inline: true }))
        }

        if (this.reasonImage) {
            embed.image = { url: this.reasonImage }
        }

        if (this.deletedAt) {
            const formattedTimestamp = formatUTCDate(this.deletedAt)
            embed.description = "*This case has been deleted.*"
            embed.color = client.config.colors.error
            embed.fields.push(
                { name: "Deleter", value: `<@${this.deleter}>`, inline: true },
                { name: "Deletion reason", value: this.deleteReason, inline: true },
                { name: "Deletion time", value: formattedTimestamp, inline: true }
            )
        }

        if (this.punishment?.end > new Date()) {
            const end = this.punishment.end.getTime() - Date.now()
            embed.description = `*Ending in ${formatPunishmentTime(end, true)}.*`
        }

        return embed
    }

    async notifyMember(client: Client): Promise<void> {
        const length = this.length ? " " + formatPunishmentTime(this.length) : ""
        const actioned = past(this.action)
        const color = this.action.startsWith("un") ? "success" : "error"

        const embed: Discord.MessageEmbedOptions = {
            color: client.config.colors[color],
            description: `*<@${this.executor}> has ${actioned} you${length}:*\n\n${this.reason}`,
            image: this.reasonImage ? { url: this.reasonImage } : null
        }

        if (this.action === "ban") {
            embed.description += "\n\u200B"
            embed.fields = [{ name: "Appealing", value: client.config.appeal }]
        }

        const user = await client.users.fetch(this.member, true)
        if (!user) return
        await user // both createDM() and send() can fail, so use a promise chain
            .createDM()
            .then(dms => dms.send({ embed }))
            .catch(noop)
    }
}
