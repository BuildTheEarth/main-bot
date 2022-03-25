import { ms } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import CommandMessage from "./CommandMessage.js"

export default class Args {
    raw: string
    command: string
    message: CommandMessage

    constructor(value: string, message: CommandMessage) {
        this.raw = value.trim()
        this.message = message
        this.command = this.consumeCommand()
    }

    split(argNames: string[]): string[] {
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

    splitMultiple(argNames: string[]): string[] {
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

    get(argName: string): string
    get(argName: string, count: number): string[]
    get(argName: string): string | string[] {
        if ((this.message.message as Discord.CommandInteraction).options.get(argName))
            return (this.message.message as Discord.CommandInteraction).options
                .get(argName)
                .value.toString().replace(/\\n/g,'\n')
        return ""
    }

    consumeCommand(): string {
        return this.message.message.commandName
    }

    consume(argName: string): string
    consume(argName: string, count: number): string[]
    consume(argName: string, count?: number): string | string[] {
        const args = this.get(argName, count)
        return args
    }

    consumeIf(
        equals: string | string[] | RegExp | ((arg: string) => boolean),
        argName: string
    ): string {
        let arg: string = null

        if (this.message.message.options.get(argName))
            arg = this.message.message.options.get(argName).value.toString()
        else arg = ""
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
    consumeRest(argNames: string[]): string | string[] {
        const returnArgs = []
        argNames.forEach(element => {
            let option: string
            if (
                (this.message.message as Discord.CommandInteraction).options
                    .get(element)
                    ?.value.toString()
            )
                option = (this.message.message as Discord.CommandInteraction).options
                    .get(element)
                    .value.toString()
            if (option) returnArgs.push(option)
        })
        if (returnArgs.length === 1) return returnArgs[0]
        if (returnArgs.length === 0) return null
        else return returnArgs
    }

    removeCodeblock(text: string): string {
        return text
            .replace(/^`(``)?([a-z]+\n)?/i, "")
            .replace(/`(``)?$/, "")
            .trim()
    }

    consumeLength(argName: string): number {
        if (this.message.isNormalCommand()) {
            try {
                let parsed = ms(this.consume(argName))
                if (parsed === undefined) parsed = Number(parsed)
                return Number.isNaN(parsed) ? null : parsed
            } catch {
                return null
            }
        }
        if (this.message.isSlashCommand()) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let parsed: any = ms(this.message.message.options.getString(argName))
                if (parsed === undefined) parsed = Number(parsed)
                return Number.isNaN(parsed) ? null : parsed
            } catch {
                return null
            }
        }
    }

    async consumeChannel(argName: string): Promise<Discord.Channel> {
        return this.message.message.options.getChannel(argName) as Discord.Channel
    }

    async consumeUser(argName: string): Promise<Discord.User> {
        return this.message.message.options.getUser(argName)
    }

    async consumeRole(argName: string): Promise<Discord.Role> {
        return this.message.message.options.getRole(argName) as Discord.Role
    }

    consumeAttachment(
        check?: (attachment: Discord.MessageAttachment) => boolean
    ): Discord.MessageAttachment {
        //NOTE: USE THE ATTACHMENT STUFF WHEN 13.7 IS AVAILABLE
        return null
    }

    consumeImage(argName: string): string {
        //NOTE: USE THE ATTACHMENT STUFF WHEN 13.7 IS AVAILABLE
        const url = this.consumeIf(/https?:\/\/(.+)?\.(jpe?g|png|gif)/i, argName)
        if (url)
            return url.replace(
                /.(jpe?g|png|gif)/i,
                url.match(/.(jpe?g|png|gif)/i)[0].toLowerCase()
            )

        return null
    }

    checkSubcommand(compareTo: string): boolean {
        return this.message.message.options.getSubcommand() === compareTo
    }

    checkSubcommandGroup(compareTo: string): boolean {
        return this.message.message.options.getSubcommandGroup() === compareTo
    }

    consumeSubcommandIf(
        equals?: string | string[] | RegExp | ((arg: string) => boolean)
    ): string {
        if (equals) {
            let arg: string = null

            try {
                arg = this.message.message.options.getSubcommand()
            } catch {
                arg = ""
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

            try {
                arg = this.message.message.options.getSubcommandGroup()
            } catch {
                arg = ""
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
        try {
            return this.message.message.options.getSubcommand()
        } catch {
            return ""
        }
    }

    consumeSubcommandGroup(): string {
        try {
            return this.message.message.options.getSubcommandGroup()
        } catch {
            return ""
        }
    }
}
