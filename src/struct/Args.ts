import ms from "ms"
import Discord from "discord.js"
import CommandMessage from "./CommandMessage"

export default class Args {
    raw: string
    command: string
    separator?: string
    message: CommandMessage

    constructor(value: string, message: CommandMessage) {
        this.raw = value.trim()
        this.message = message
        this.command = this.consumeCommand()
    }

    split(argNames: string[]): string[] {
        if (this.message.message instanceof Discord.Message) {
            return this.separator
                ? this.raw.split(this.separator).map(arg => arg.trim())
                : this.raw.split(/\s/)
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            const returnArgs = []
            argNames.forEach(element =>
                returnArgs.push(
                    (this.message.message as Discord.CommandInteraction).options
                        .get(element)
                        .value.toString()
                )
            )
            return returnArgs
        }
    }

    splitMultiple(argNames: string[]): string[] {
        if (this.message.message instanceof Discord.Message) {
            return this.separator ? this.split(argNames) : this.raw.split(/\s+/)
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            const returnArgs = []
            argNames.forEach(element =>
                returnArgs.push(
                    (this.message.message as Discord.CommandInteraction).options
                        .get(element)
                        .value.toString()
                )
            )
            return returnArgs
        }
    }

    get(argName: string): string
    get(argName: string, count: number): string[]
    get(argName: string, count?: number): string | string[] {
        if (this.message.message instanceof Discord.Message) {
            return count
                ? this.splitMultiple([argName]).slice(0, count)
                : this.split([argName])[0]
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            if ((this.message.message as Discord.CommandInteraction).options.get(argName))
                return (this.message.message as Discord.CommandInteraction).options
                    .get(argName)
                    .value.toString()
            return ""
        }
    }

    consumeCommand(): string {
        if (this.message.message instanceof Discord.Message) {
            return this.consume("")
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            return this.message.message.commandName
        }
    }

    consume(argName: string): string
    consume(argName: string, count: number): string[]
    consume(argName: string, count?: number): string | string[] {
        const args = this.get(argName, count)
        this.remove(count)
        return args
    }

    consumeIf(
        equals: string | string[] | RegExp | ((arg: string) => boolean),
        argName: string
    ): string {
        let arg: string = null
        if (this.message.message instanceof Discord.Message) {
            arg = this.get(argName)
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            if ((this.message.message as Discord.CommandInteraction).options.get(argName))
                arg = (this.message.message as Discord.CommandInteraction).options
                    .get(argName)
                    .value.toString()
            else arg = ""
        }
        let valid = false

        if (typeof equals === "string") valid = equals.toLowerCase() === arg.toLowerCase()
        else if (Array.isArray(equals)) valid = equals.includes(arg)
        else if (equals instanceof RegExp) valid = equals.test(arg)
        else if (typeof equals === "function") valid = equals(arg)
        if (!valid) return null

        return typeof equals === "function" || equals instanceof RegExp
            ? this.consume(argName)
            : this.consume(argName).toLowerCase()
    }

    consumeRest(argNames: string[]): string
    consumeRest(argNames: string[], count: number): string[]
    consumeRest(argNames: string[], count?: number): string | string[] {
        if (this.message.message instanceof Discord.Message) {
            if (!count) {
                const args = this.raw.trim()
                this.raw = ""
                return args
            } else {
                const args = this.consume("", count - 1)
                args.push(this.consumeRest([""]))
                return args
            }
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            const returnArgs = []
            argNames.forEach(element => {
                let option: string
                if (
                    (this.message.message as Discord.CommandInteraction).options
                        .get(element)
                        .value.toString()
                )
                    option = (this.message.message as Discord.CommandInteraction).options
                        .get(element)
                        .value.toString()
                if (option) returnArgs.push(option)
            })
            if (returnArgs.length == 1) return returnArgs[0]
            else return returnArgs
        }
    }

    remove(count: number = 1): string {
        if (this.message.message instanceof Discord.Message) {
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
        if (this.message.message instanceof Discord.CommandInteraction) return ""
    }

    removeCodeblock(text: string): string {
        return text
            .replace(/^`(``)?([a-z]+\n)?/i, "")
            .replace(/`(``)?$/, "")
            .trim()
    }

    consumeLength(argName: string): number {
        if (this.message.message instanceof Discord.Message) {
            try {
                const parsed = ms(this.consume(argName))
                return parsed === undefined ? null : parsed
            } catch {
                return null
            }
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            try {
                const parsed: any = ms(this.message.message.options.getString(argName))
                return parsed === undefined ? null : parsed
            } catch {
                return null
            }
        }
    }

    async consumeChannel(argName: string): Promise<Discord.Channel> {
        if (this.message.message instanceof Discord.Message) {
            const id = this.raw.match(/^(<#)?(\d{18})>?/)?.[2]
            if (!id) return null
            this.remove()
            const channel: Discord.TextChannel =
                await this.message.message.client.channels
                    .fetch(id, { force: true })
                    .catch(() => null)
            return channel
        }
        if (this.message.message instanceof Discord.CommandInteraction)
            return this.message.message.options.getChannel(argName) as Discord.Channel
    }

    async consumeUser(
        argName: string,
        allowSpecial: boolean = false
    ): Promise<Discord.User> {
        if (this.message.message instanceof Discord.Message) {
            if (allowSpecial) {
                const special = this.consumeIf(
                    ["me", "you", "yourself", "someone"],
                    argName
                )
                if (special) {
                    const users = this.message.message.client.users.cache
                    switch (special) {
                        case "me":
                            return this.message.message.author
                        case "you":
                        case "yourself":
                            return this.message.message.client.user
                        case "someone":
                            return users.random()
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
                this.consume(argName)
                const user: Discord.User = await users
                    .fetch(id, { force: true })
                    .catch(() => null)
                return user || null
            } else if (!tag && !id) {
                return undefined
            }
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            return this.message.message.options.getUser(argName)
        }
    }

    consumeAttachment(
        check?: (attachment: Discord.MessageAttachment) => boolean
    ): Discord.MessageAttachment {
        if (this.message.message instanceof Discord.Message) {
            return check
                ? this.message.message.attachments.find(check) || null
                : this.message.message.attachments.first() || null
        } else return null
    }

    consumeImage(argName: string): string {
        if (this.message.message instanceof Discord.Message) {
            const check = (att: Discord.MessageAttachment) =>
                !!att.name.match(/\.(jpe?g|png|gif)$/i)
            const attachment = this.consumeAttachment(check)
            if (attachment) return attachment.url

            const url = this.consumeIf(/https?:\/\/(.+)?\.(jpe?g|png|gif)/i, argName)
            if (url)
                return url.replace(
                    /.(jpe?g|png|gif)/i,
                    url.match(/.(jpe?g|png|gif)/i)[0].toLowerCase()
                )

            return null
        }
        if (this.message.message instanceof Discord.CommandInteraction) {
            const url = this.consumeIf(/https?:\/\/(.+)?\.(jpe?g|png|gif)/i, argName)
            if (url)
                return url.replace(
                    /.(jpe?g|png|gif)/i,
                    url.match(/.(jpe?g|png|gif)/i)[0].toLowerCase()
                )

            return null
        }
    }

    checkSubcommand(compareFromValue: string, compareTo: string): boolean {
        if (this.message.message instanceof Discord.Message)
            return compareFromValue === compareTo
        if (this.message.message instanceof Discord.CommandInteraction)
            return this.message.message.options.getSubcommand() === compareTo
    }

    checkSubcommandGroup(compareFromValue: string, compareTo: string): boolean {
        if (this.message.message instanceof Discord.Message)
            return compareFromValue === compareTo
        if (this.message.message instanceof Discord.CommandInteraction)
            return this.message.message.options.getSubcommandGroup() === compareTo
    }

    consumeSubcommandIf(
        equals?: string | string[] | RegExp | ((arg: string) => boolean)
    ): string {
        if (equals) {
            let arg: string = null
            if (this.message.message instanceof Discord.Message) {
                arg = this.get("")
            }
            if (this.message.message instanceof Discord.CommandInteraction) {
                try {
                    arg = this.message.message.options.getSubcommand()
                } catch {
                    arg = ""
                }
            }
            let valid = false

            if (typeof equals === "string")
                valid = equals.toLowerCase() === arg.toLowerCase()
            else if (Array.isArray(equals)) valid = equals.includes(arg)
            else if (equals instanceof RegExp) valid = equals.test(arg)
            else if (typeof equals === "function") valid = equals(arg)
            if (!valid) return null

            return typeof equals === "function" || equals instanceof RegExp
                ? this.consumeSubcommand()
                : this.consumeSubcommand().toLowerCase()
        }
    }

    consumeSubcommandGroupIf(
        equals?: string | string[] | RegExp | ((arg: string) => boolean)
    ): string {
        if (equals) {
            let arg: string = null
            if (this.message.message instanceof Discord.Message) {
                arg = this.get("")
            }
            if (this.message.message instanceof Discord.CommandInteraction) {
                try {
                    arg = this.message.message.options.getSubcommandGroup()
                } catch {
                    arg = ""
                }
            }
            let valid = false

            if (typeof equals === "string")
                valid = equals.toLowerCase() === arg.toLowerCase()
            else if (Array.isArray(equals)) valid = equals.includes(arg)
            else if (equals instanceof RegExp) valid = equals.test(arg)
            else if (typeof equals === "function") valid = equals(arg)
            if (!valid) return null

            return typeof equals === "function" || equals instanceof RegExp
                ? this.consumeSubcommandGroup()
                : this.consumeSubcommandGroup().toLowerCase()
        }
    }

    consumeSubcommand(): string {
        if (this.message.message instanceof Discord.Message) return this.consume("")
        if (this.message.message instanceof Discord.CommandInteraction)
            try {
                return this.message.message.options.getSubcommand()
            } catch {
                return ""
            }
    }

    consumeSubcommandGroup(): string {
        if (this.message.message instanceof Discord.Message) return this.consume("")
        if (this.message.message instanceof Discord.CommandInteraction)
            try {
                return this.message.message.options.getSubcommandGroup()
            } catch {
                return ""
            }
    }
}
