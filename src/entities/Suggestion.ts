import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    LessThan
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import Discord from "discord.js"
import Client from "../struct/Client"

export type SuggestionStatus = keyof typeof SuggestionStatuses
export enum SuggestionStatuses {
    "approved" = "Approved",
    "denied" = "Denied",
    "duplicate" = "Marked as duplicate",
    "forwarded" = "Forwarded to the respective team",
    "in-progress" = "Marked as in progress",
    "information" = "Marked as needing more information",
    "invalid" = "Invalidated"
}

@Entity({ name: "suggestions" })
export default class Suggestion extends BaseEntity {
    static ALPHABET = "abcdefghijklmnopqrstuvwxyz"

    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    number?: number

    @Column({ nullable: true })
    extends?: number

    @SnowflakeColumn()
    author: string

    @Column()
    anonymous: boolean

    @Column()
    title: string

    @Column({ length: 2048 })
    body: string

    @Column({ nullable: true })
    teams?: string

    @Column({ nullable: true })
    status?: SuggestionStatus

    @SnowflakeColumn({ nullable: true, name: "status_updater" })
    statusUpdater?: string

    @Column({ nullable: true, length: 1024, name: "status_reason" })
    statusReason?: string

    @SnowflakeColumn()
    message: string

    @Column()
    staff: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date

    @SnowflakeColumn({ nullable: true })
    deleter?: string

    static async findNumber(staff: boolean): Promise<number> {
        const existing = await this.count({ where: { staff }, withDeleted: true })
        if (staff) return existing + 352
        else if (!staff) return existing + 1000
    }

    async getDisplayNumber(): Promise<string> {
        if (!this.extends) {
            return this.number.toString()
        } else {
            const extenders = await Suggestion.find({
                extends: this.extends,
                createdAt: LessThan(this.createdAt)
            })
            const letter = Suggestion.ALPHABET[extenders.length + 1]
            return this.extends + letter
        }
    }

    getURL(client: Client): string {
        const category = this.staff ? "staff" : "main"
        const guild = client.config.guilds[category]
        const channel = client.config.suggestions[category]
        const message = this.message
        return `https://discord.com/channels/${guild}/${channel}/${message}`
    }

    async displayEmbed(client: Client): Promise<Discord.MessageEmbedOptions> {
        if (this.deletedAt) {
            const deleter =
                this.deleter === this.author ? "the author" : `<@${this.deleter}>`
            return {
                color: client.config.colors.error,
                description: `**#${this.number}**: The suggestion has been deleted by ${deleter}.`
            }
        }

        const displayNumber = await this.getDisplayNumber()
        const embed: Discord.MessageEmbedOptions = {
            color: "#999999",
            author: { name: `#${displayNumber} — ${this.title}` },
            thumbnail: { url: null },
            description: this.body,
            fields: []
        }

        if (!this.anonymous) {
            embed.fields.push({ name: "Author", value: `<@${this.author}>` })
            if (!this.status) {
                const author = client.users.cache.get(this.author)
                if (author) {
                    embed.thumbnail.url = author.displayAvatarURL({
                        size: 128,
                        format: "png",
                        dynamic: true
                    })
                }
            }
        }
        if (this.teams) embed.fields.push({ name: "Team/s", value: this.teams })

        if (this.status) {
            const action = SuggestionStatuses[this.status]
            const reason = this.statusReason ? `\n\n${this.statusReason}` : ""
            const assets = client.config.assets.suggestions
            embed.color = client.config.colors.suggestions[this.status]
            embed.thumbnail.url = assets[this.status]
            embed.fields.push({
                name: "Status",
                value: `*${action} by <@${this.statusUpdater}>.*${reason}`
            })
        }

        return embed
    }
}
