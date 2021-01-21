import ms from "ms"
import Discord from "discord.js"
import Message from "./discord/Message"

export default class Args {
    raw: string
    command: string
    separator?: string
    message: Message

    constructor(value: string, message: Message) {
        this.raw = value.trim()
        this.command = this.consume()
        this.message = message
    }

    get split(): string[] {
        return this.separator
            ? this.raw.split(this.separator).map(arg => arg.trim())
            : this.raw.split(/\s/)
    }

    get splitMultiple(): string[] {
        return this.separator ? this.split : this.raw.split(/\s+/)
    }

    get(): string
    get(count: number): string[]
    get(count?: number): string | string[] {
        return count ? this.splitMultiple.slice(0, count) : this.split[0]
    }

    consume(): string
    consume(count: number): string[]
    consume(count?: number): string | string[] {
        const args = this.get(count)
        this.remove(count)
        return args
    }

    consumeIf(equals: string | string[] | RegExp | ((arg: string) => boolean)): string {
        let valid = false
        const arg = this.get()

        if (typeof equals === "string") valid = equals.toLowerCase() === arg.toLowerCase()
        else if (Array.isArray(equals)) valid = equals.includes(arg)
        else if (equals instanceof RegExp) valid = equals.test(arg)
        else if (typeof equals === "function") valid = equals(arg)
        if (!valid) return null

        return typeof equals === "function" || equals instanceof RegExp
            ? this.consume()
            : this.consume().toLowerCase()
    }

    consumeRest(): string
    consumeRest(count: number): string[]
    consumeRest(count?: number): string | string[] {
        if (!count) {
            const args = this.raw.trim()
            this.raw = ""
            return args
        } else {
            const args = this.consume(count - 1)
            args.push(this.consumeRest())
            return args
        }
    }

    remove(count: number = 1): string {
        if (this.separator) {
            this.raw = this.raw
                .split(this.separator)
                .slice(count)
                .join(this.separator)
                .trim()
        } else {
            const regex = new RegExp(`^([^\\s]+(\\s+|$)){1,${count}}`)
            this.raw = this.raw.replace(regex, "")
        }

        return this.raw
    }

    removeCodeblock(): string {
        return (this.raw = this.raw
            .replace(/^`(``)?([a-z]+\n)?/i, "")
            .replace(/`(``)?$/, "")
            .trim())
    }

    consumeLength(): number {
        try {
            const parsed = ms(this.consume())
            return parsed === undefined ? null : parsed
        } catch {
            return null
        }
    }

    async consumeChannel(): Promise<Discord.TextChannel> {
        const id = this.raw.match(/^(<#)?(\d{18})>?/)?.[2]
        if (!id) return null
        this.remove()
        const channel: Discord.TextChannel = await this.message.client.channels
            .fetch(id, true)
            .catch(() => null)
        return channel
    }

    async consumeUser(allowSpecial: boolean = false): Promise<Discord.User> {
        if (allowSpecial) {
            const special = this.consumeIf(["me", "you", "yourself", "someone"])
            if (special) {
                const users = this.message.client.users.cache
                switch (special) {
                    case "me":
                        return this.message.author
                    case "you":
                    case "yourself":
                        return this.message.client.user
                    case "someone":
                        return users.array()[Math.floor(Math.random() * users.size)]
                }
            }
        }

        const tag = this.raw.match(/^.{2,32}#\d{4}/)?.[0]
        const id = this.raw.match(/^(<@!?)?(\d{18})>?/)?.[2]
        const users = this.message.client.users

        if (tag) {
            this.raw = this.raw.replace(tag, "").trim()
            const user = users.cache.find(user => user.tag === tag)
            return user || null
        } else if (id) {
            this.consume()
            const user: Discord.User = await users.fetch(id, true).catch(() => null)
            return user || null
        } else if (!tag && !id) {
            return undefined
        }
    }

    consumeAttachment(
        check?: (attachment: Discord.MessageAttachment) => boolean
    ): Discord.MessageAttachment {
        return check
            ? this.message.attachments.find(check) || null
            : this.message.attachments.first() || null
    }

    consumeImage(): string {
        const check = (att: Discord.MessageAttachment) =>
            !!att.name.match(/\.(jpe?g|png|gif)$/)
        const attachment = this.consumeAttachment(check)
        if (attachment) return attachment.url

        const url = this.consumeIf(/https?:\/\/(.+)?\.(jpe?g|png|gif)/)
        if (url) return url

        return null
    }
}
