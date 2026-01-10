import typeorm from "typeorm"
import type BotClient from "../struct/BotClient.js"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import milliseconds from "./transformers/milliseconds.transformer.js"
import unicode from "./transformers/unicode.transformer.js" 
import { Collection } from "discord.js"

export type bannedTypes = Collection<string, BannedWord>

export interface bannedInfo {
    punishment_type: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"
    reason: string
    duration: number
}

export interface bannedWordsOptions {
    word?: string
    punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"
    reason?: string
    duration: number | null
    exception?: boolean
    regex?: boolean
}

@typeorm.Entity({ name: "banned_words" })
export default class BannedWord extends typeorm.BaseEntity {
    static async createBannedWord(
        options: bannedWordsOptions,
        client: BotClient
    ): Promise<BannedWord> {
        const created = new BannedWord()
        if (options.word !== undefined) created.word = options.word.toLowerCase()
        if (options.punishment_type !== undefined)
            created.punishment_type = options.punishment_type
        if (options.reason !== undefined) created.reason = options.reason
        if (options.duration !== undefined) created.duration = options.duration
        if (options.exception) created.exception = options.exception
        if (options.regex) created.regex = options.regex

        await created.save()
        if (options.word !== undefined) {
            if (options.exception) client.filterWordsCached.except.push(options.word)
            else client.filterWordsCached.banned.set(options.word, created)
        }
        return created
    }

    @typeorm.PrimaryColumn({ type: "varchar", length: 100 })
    word!: string

    @typeorm.Column({ nullable: true })
    punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"

    @typeorm.Column({ length: 1024, nullable: true, transformer: unicode })
    reason?: string

    @typeorm.Column({
        nullable: true,
        transformer: milliseconds,
        default: null,
        type: "int"
    })
    duration?: number | null

    @typeorm.Column({ default: false })
    exception: boolean = false

    @typeorm.Column({ default: false })
    regex: boolean = false

    static async loadWords(): Promise<{ banned: bannedTypes; except: Array<string> }> {
        const values = await this.find()
        const banned: bannedTypes = new Collection<string, BannedWord>()
        const except: Array<string> = []
        values.forEach((word: BannedWord) => {
            if (word.exception) except.push(word.word.toLowerCase())
            else banned.set(word.word.toLowerCase(), word)
        })
        return { banned: banned, except: except }
    }

    async deleteWord(client: BotClient): Promise<void> {
        if (this.exception)
            client.filterWordsCached.except = client.filterWordsCached.except.filter(
                (value: string) => value !== this.word
            )
        else client.filterWordsCached.banned.delete(this.word.toLowerCase())
        await this.remove()
        return
    }
}
