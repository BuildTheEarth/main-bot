import typeorm from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import Discord from "discord.js"
import path from "path"
import url from "url"
import Client from "../struct/Client.js"
import { hexToNum, hexToRGB, loadSyncJSON5, replaceAsync } from "@buildtheearth/bot-utils"
import unicode from "./transformers/unicode.transformer.js"
const suggestionStatusActions = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/suggestionStatusActions.json5"
    )
)

export type SuggestionStatus = keyof typeof SuggestionStatuses
export enum SuggestionStatuses {
    "approved",
    "denied",
    "duplicate",
    "forwarded",
    "in-progress",
    "information",
    "invalid"
}

export interface Identifier {
    number: number
    extension: string | null
}

@typeorm.Entity({ name: "suggestions" })
export default class Suggestion extends typeorm.BaseEntity {
    static ALPHABET = "abcdefghijklmnopqrstuvwxyz"

    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ nullable: true })
    number?: number

    @typeorm.Column({ nullable: true })
    extends?: number

    @SnowflakeColumn()
    author!: string

    @typeorm.Column()
    anonymous!: boolean

    @typeorm.Column()
    title!: string

    @typeorm.Column({ length: 2048, transformer: unicode })
    body!: string

    @typeorm.Column({ nullable: true })
    teams?: string

    @typeorm.Column({ nullable: true })
    status?: SuggestionStatus

    @SnowflakeColumn({ nullable: true, name: "status_updater" })
    statusUpdater?: string

    @typeorm.Column({ nullable: true, length: 1024, name: "status_reason" })
    statusReason?: string

    @SnowflakeColumn()
    message!: string

    @SnowflakeColumn({ nullable: true })
    thread?: string

    @typeorm.Column()
    staff!: boolean

    @typeorm.CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @typeorm.DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date

    @SnowflakeColumn({ nullable: true })
    deleter?: string

    static async findNumber(staff: boolean, client: Client): Promise<number> {
        const field = staff ? "staff" : "main"
        const existing = await this.count({
            where: {
                staff: staff,
                extends: null
            },
            withDeleted: true
        })

        return existing + client.config.suggestionOffset[field]
    }

    async getIdentifier(): Promise<string> {
        if (!this.extends && this.number) {
            return this.number.toString()
        } else {
            const extenders = await Suggestion.find({
                extends: this.extends,
                createdAt: typeorm.LessThan(this.createdAt || new Date())
            })
            const letter = Suggestion.ALPHABET[extenders.length + 1]
            return this.extends + letter
        }
    }

    static async findByIdentifier(
        identifier: Identifier,
        staff: boolean
    ): Promise<Suggestion | undefined> {
        if (!identifier.extension)
            return await this.findOne({ number: identifier.number, staff })

        const extensionNumber = Suggestion.ALPHABET.indexOf(identifier.extension) - 1
        return await Suggestion.getRepository()
            .createQueryBuilder("suggestion")
            .withDeleted()
            .where("suggestion.extends = :extends", { extends: identifier.number })
            .andWhere("suggestion.staff = :staff", { staff })
            .orderBy("suggestion.created_at", "ASC")
            .skip(extensionNumber)
            .take(1) // required for skip()
            .getOne()
    }

    static parseIdentifier(input: string): Identifier {
        input = input
            .trim()
            .replace(/^\*?\*?#?/, "")
            .replace(/:?\*?\*?:?$/, "")
        const number = Number(input.match(/\d+/)?.[0])
        const extensionMatch = input.match(/[b-z]$/i)?.[0]
        const extension = extensionMatch ? extensionMatch.toLowerCase() : null
        return { number, extension }
    }

    static isIdentifier(input: string): boolean {
        const identifier = Suggestion.parseIdentifier(input)
        return !!identifier.number && !!identifier.extension
    }

    getURL(client: Client): string {
        const category = this.staff ? "staff" : "main"
        const guild = client.config.guilds[category]
        const channel = client.config.suggestions[category]
        const message = this.message
        return `https://discord.com/channels/${guild}/${channel}/${message}`
    }

    async displayEmbed(client: Client): Promise<Discord.APIEmbed> {
        const identifier = await this.getIdentifier()

        if (this.deletedAt) {
            const deleter =
                this.deleter === this.author ? "the author" : `<@${this.deleter}>`
            return {
                color: hexToNum(client.config.colors.error),
                description: `**#${identifier}**: The suggestion has been deleted by ${deleter}.`
            }
        }

        const embed = <Discord.APIEmbed>{
            color: hexToNum("#999999"),
            author: { name: `#${identifier} — ${this.title}` },
            description: this.body,
            fields: []
        }

        if (!this.anonymous) {
            embed.fields?.push({ name: "Author", value: `<@${this.author}>` })
            if (!this.status) {
                const author = client.users.cache.get(this.author)
                if (author && embed.thumbnail) {
                    embed.thumbnail.url = author.displayAvatarURL({
                        size: 128,
                        extension: "png",
                        forceStatic: false
                    })
                }
            }
        }
        if (this.teams) embed.fields?.push({ name: "Team/s", value: this.teams })

        if (this.status) {
            embed.color = hexToNum(client.config.colors.suggestions[this.status])
            if (embed.thumbnail)
                embed.thumbnail.url = client.config.assets.suggestions[this.status]

            let action = suggestionStatusActions[this.status] as string
            let reason = this.statusReason || ""
            let refers = ""
            if (this.status === "forwarded" || this.status === "duplicate") {
                const prep = { forwarded: "to", duplicate: "of" }[this.status]
                // "to/of ($1). ($2)"
                const regex = new RegExp(`^${prep}\\s+([^.]+)(?:\\.\\s+)?(.+)?`, "i")
                const match = reason.match(regex)
                if (match) {
                    refers = ` ${prep} ${match[1]}`
                    reason = match[2] || ""
                    if (this.status === "forwarded")
                        action = action.replace("to the respective team", "")
                }
            }

            // link suggestion numbers
            const regex = /#?\d+[a-z]?/gi
            const replacer = async (input: string) => {
                const identifier = Suggestion.parseIdentifier(input)
                // prettier-ignore
                const suggestion = await Suggestion.findByIdentifier(identifier, this.staff)
                if (!suggestion) return input
                return `[${input}](${suggestion.getURL(client)})`
            }

            refers = await replaceAsync(refers, regex, replacer)
            reason = await replaceAsync(reason, regex, replacer)

            embed.fields?.push({
                name: "Status",
                value: `*${action}${refers} by <@${this.statusUpdater}>.*\n\n${reason}`
            })
        }

        return embed
    }
}
