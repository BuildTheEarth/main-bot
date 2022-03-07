import typeorm from "typeorm"
import type Client from "../struct/Client.js"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import milliseconds from "./transformers/milliseconds.transformer.js"

export type bannedTypes = Map<string, BannedWord>

export interface bannedInfo {
    punishment_type: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"
    reason: string
    duration: number
}

export interface bannedWordsOptions {
    word?: string
    punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"
    reason?: string
    duration?: number
    exception?: boolean
}

@typeorm.Entity({ name: "banned_words" })
export default class BannedWord extends typeorm.BaseEntity {
    private constructor(
        word: string = null,
        punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE",
        reason: string = null,
        duration: number = null,
        exception: boolean = null,
        client?: Client
    ) {
        super()
        if (word !== null) this.word = word
        if (punishment_type) this.punishment_type = punishment_type
        if (reason !== undefined) this.reason = reason
        if (duration !== undefined) this.duration = duration
        if (exception !== null) this.exception = exception
        if (client) {
            if (exception) client.filterWordsCached.except.push(word)
            else
                client.filterWordsCached.banned[word] = {
                    punishment_type: punishment_type,
                    reason: reason === null ? "none" : reason,
                    duration: duration === null ? 0 : duration
                }
        }
    }

    static async createBannedWord(
        options: bannedWordsOptions,
        client: Client
    ): Promise<BannedWord> {
        return await new BannedWord(
            options.word,
            options.punishment_type,
            options.reason,
            options.duration,
            options.exception,
            client
        ).save()
    }

    @SnowflakePrimaryColumn()
    word!: string

    @typeorm.Column({ nullable: true })
    punishment_type!: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"

    @typeorm.Column({ length: 1024, nullable: true })
    reason!: string

    @typeorm.Column({ nullable: true, transformer: milliseconds })
    duration?: number

    @typeorm.Column({ default: false })
    exception: boolean = false

    static async loadWords(): Promise<{ banned: bannedTypes; except: Array<string> }> {
        const values = await this.find()
        const banned: bannedTypes = new Map<string, BannedWord>()
        const except: Array<string> = []
        values.forEach(word => {
            if (word.exception) except.push(word.word)
            else banned[word.word] = word
        })
        return { banned: banned, except: except }
    }

    async deleteWord(client: Client): Promise<void> {
        if (this.exception)
            client.filterWordsCached.except = client.filterWordsCached.except.filter(
                value => value !== this.word
            )
        else delete client.filterWordsCached.banned[this.word]
        await this.remove()
        return
    }
}
