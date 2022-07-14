import typeorm from "typeorm"
import type Client from "../struct/Client.js"
import milliseconds from "./transformers/milliseconds.transformer.js"
import unicode from "./transformers/unicode.transformer.js"

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
    static async createBannedWord(
        options: bannedWordsOptions,
        client: Client
    ): Promise<BannedWord> {
        const created = new BannedWord()
        if (options.word) {
            created.word = options.word
            if (options.exception) client.filterWordsCached.except.push(options.word)
            else
                    client.filterWordsCached.banned.set(options.word, <BannedWord>{
                        punishment_type: options.punishment_type,
                        reason: options.reason === null ? "none" : options.reason,
                        duration: options.duration === null ? 0 : options.duration
                })
        }
        if (options.punishment_type) created.punishment_type = options.punishment_type
        if (options.reason) created.reason = options.reason
        if (options.duration) created.duration = options.duration
        if (options.exception) created.exception = options.exception
        await created.save()
        return created
    }

    @typeorm.Column({ length: 16, nullable: true, transformer: unicode, primary: true })
    word!: string

    @typeorm.Column({ nullable: true })
    punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK" | "DELETE"

    @typeorm.Column({ length: 1024, nullable: true, transformer: unicode })
    reason?: string

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
            else banned.set(word.word, word)
        })
        return { banned: banned, except: except }
    }

    async deleteWord(client: Client): Promise<void> {
        if (this.exception)
            client.filterWordsCached.except = client.filterWordsCached.except.filter(
                value => value !== this.word
            )
        else client.filterWordsCached.banned.delete(this.word)
        await this.remove()
        return
    }
}
