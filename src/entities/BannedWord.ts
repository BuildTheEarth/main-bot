import { Entity, Column, BaseEntity } from "typeorm"
import Client from "../struct/Client"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn"
import milliseconds from "./transformers/milliseconds"

export interface bannedTypes {
    [name: string]: {
        punishment_type:  "BAN" | "WARN" | "MUTE" | "KICK"
        reason: string
        duration: number
    }
}

export interface bannedWordsOptions {
    word: string
    punishment_type:  "BAN" | "WARN" | "MUTE" | "KICK"
    reason: string
    duration: number
    exception: boolean
}

@Entity({ name: "banned_words" })
export default class BannedWord extends BaseEntity {
    private constructor(
        word?: string,
        punishment_type?: "BAN" | "WARN" | "MUTE" | "KICK",
        reason?: string,
        duration?: number,
        exception?: boolean,
        client?: Client
    ) {
        super()
        this.word = word
        this.punishment_type = punishment_type
        this.reason = reason
        this.duration = duration
        this.exception = exception
        if (exception) client.filterWordsCached.except.push(word)
        else
            client.filterWordsCached.banned[word] = {
                punishment_type: punishment_type,
                reason: reason,
                duration: duration
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
    word: string

    @Column({ nullable: true })
    punishment_type: "BAN" | "WARN" | "MUTE" | "KICK"

    @Column({ length: 1024, nullable: true })
    reason: string

    @Column({ nullable: true, transformer: milliseconds })
    duration?: number

    @Column()
    exception: boolean

    static async loadWords(): Promise<{ banned: bannedTypes; except: Array<string> }> {
        const values = await this.find()
        const banned: bannedTypes = {}
        const except: Array<string> = []
        values.forEach(word => {
            if (word.exception) except.push(word.word)
            else
                banned[word.word] = {
                    punishment_type: word.punishment_type,
                    reason: word.reason,
                    duration: word.duration
                }
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
