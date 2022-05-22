import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import Discord from "discord.js"
import Client from "../struct/Client.js"
import TimedPunishment from "./TimedPunishment.entity.js"
import milliseconds from "./transformers/milliseconds.transformer.js"
import unicode from "./transformers/unicode.transformer.js"
import {
    formatPunishmentTime,
    formatTimestamp,
    hexToRGB,
    ms,
    noop,
    truncateString,
    pastTense
} from "@buildtheearth/bot-utils"
import { URL } from "url"

export type Action = keyof typeof Actions
export enum Actions {
    "warn",
    "mute",
    "kick",
    "ban",
    "unmute",
    "unban"
}

@typeorm.Entity({ name: "action_logs" })
export default class ActionLog extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column()
    action!: Action

    @SnowflakeColumn()
    member!: string

    @SnowflakeColumn()
    executor!: string

    @typeorm.Column({ length: 1024, transformer: unicode })
    reason!: string

    @typeorm.Column({ nullable: true, name: "reason_image" })
    reasonImage?: string

    @typeorm.Column({ nullable: true, transformer: milliseconds, default: null })
    length?: number

    @SnowflakeColumn()
    channel!: string

    @SnowflakeColumn()
    message!: string

    @SnowflakeColumn({ nullable: true })
    notification?: string

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @typeorm.DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date

    @SnowflakeColumn({ nullable: true })
    deleter?: string

    @typeorm.Column({
        name: "delete_reason",
        length: 1024,
        nullable: true,
        transformer: unicode
    })
    deleteReason?: string

    @typeorm.OneToOne(() => TimedPunishment, {
        nullable: true,
        eager: true,
        onDelete: "SET NULL",
        cascade: true
    })
    @typeorm.JoinColumn({ name: "punishment_id" })
    punishment?: TimedPunishment

    get old(): boolean {
        const difference = Date.now() - this.createdAt.getTime()
        const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000
        return difference > threeMonths
    }

    format(): string {
        let formatted = truncateString(this.reason, 64, "...")
        if (this.length) formatted = `(**${ms(this.length)}**) ` + formatted
        formatted = `\` ${this.id}. \` ${formatted}`
        if (this.old) formatted = `\\📜 ${formatted}`
        return formatted
    }

    async displayEmbed(client: Client): Promise<Discord.MessageEmbedOptions> {
        const length =
            this.length !== null && this.length !== undefined
                ? formatPunishmentTime(this.length, true)
                : "\u200B"
        const embed: Discord.MessageEmbedOptions = {
            color: hexToRGB(client.config.colors.success),
            author: { name: `Case #${this.id} (${this.action})` },
            thumbnail: { url: client.config.assets.cases[this.action] },
            fields: [
                { name: "Member", value: `<@${this.member}>` },
                { name: this.length !== null ? "Length" : "\u200B", value: length },
                { name: "Reason", value: this.reason || "*None provided.*" },
                { name: "Moderator", value: `<@${this.executor}>` },
                { name: "Context", value: `[Link](${await this.contextUrl(client)})` },
                { name: "Date", value: formatTimestamp(this.createdAt, "d") }
            ].map(field => ({ ...field, inline: true }))
        }

        if (this.reasonImage) {
            embed.image = { url: this.reasonImage }
        }

        if (this.deletedAt) {
            const formattedTimestamp = formatTimestamp(this.deletedAt, "d")
            embed.description = "*This case has been deleted.*"
            embed.color = hexToRGB(client.config.colors.error)
            embed.fields?.push(
                { name: "Deleter", value: `<@${this.deleter}>`, inline: true },
                {
                    name: "Deletion reason",
                    value: this.deleteReason ? this.deleteReason : "",
                    inline: true
                },
                { name: "Deletion time", value: formattedTimestamp, inline: true }
            )
        }

        if (length !== "\u200B") {
            embed.description = `*Ending in ${length}.*`
        }

        return embed
    }

    private displayNotification(client: Client): Discord.MessageEmbedOptions {
        const length = this.length ? " " + formatPunishmentTime(this.length) : ""
        const actioned = pastTense(this.action)
        const color = this.action.startsWith("un") ? "success" : "error"

        const embed: Discord.MessageEmbedOptions = {
            color: hexToRGB(client.config.colors[color]),
            description: `*<@${this.executor}> has ${actioned} you${length}:*\n\n${this.reason}`,
            image: this.reasonImage ? { url: this.reasonImage } : undefined
        }

        if (this.action === "ban") {
            embed.description += "\n\u200B"
            embed.fields = [{ name: "Appealing", value: client.config.appeal }]
        }

        return embed
    }

    async notifyMember(client: Client): Promise<void> {
        const user = await client.users.fetch(this.member, { force: true })
        if (!user) return

        const embed = this.displayNotification(client)
        const notification = await user // both createDM() and send() can fail, so use a promise chain
            .createDM()
            .then(dms => dms.send({ embeds: [embed] }))
            .catch(noop)
        if (notification) {
            this.notification = notification.id
            await this.save()
        }
    }

    async updateNotification(client: Client): Promise<void> {
        if (!this.notification) return
        const user = await client.users.fetch(this.member, { force: true })
        if (!user) return
        const channel = user.dmChannel
        if (!channel) return

        const notification = await channel.messages.fetch(this.notification, {
            force: true
        })
        const embed = this.displayNotification(client)
        await notification.edit({ embeds: [embed] }).catch(noop)
    }

    async contextUrl(client: Client): Promise<URL> {
        return new URL(
            `https://discord.com/channels/${(await client.customGuilds.main()).id}/${
                this.channel
            }/${this.message}`
        )
    }
}
