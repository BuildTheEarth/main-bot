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
        const returnArgs: string[] = []
        argNames.forEach(element => {
                const tempEle = (this.message.message as Discord.CommandInteraction).options
                    .get(element)
                    ?.value?.toString()
                if (tempEle) returnArgs.push(
                    tempEle
                )
            }
        )
        return returnArgs
    }

    splitMultiple(argNames: string[]): string[] {
        const returnArgs: string[] = []
        argNames.forEach(element => {
                const tempEle = (this.message.message as Discord.CommandInteraction).options.get(element)?.value?.toString()
                if (tempEle) returnArgs.push(
                    tempEle
                )
            }
        )
        return returnArgs
    }

    get(argName: string): string
    get(argName: string, count: number | undefined): string[]
    get(argName: string): string | string[] | null {
        const retVal = (this.message.message as Discord.CommandInteraction).options.get(argName)
        if (retVal) {
            if (retVal.value) return retVal.value.toString().replace(/\\n/g, "\n")
        }
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
    ): string | null {
        let arg: string | null = null

        const tempArg = this.message.message.options.get(argName)
        if (tempArg && tempArg.value) arg = tempArg.value.toString().replace(/\\n/g, "\n")
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
    consumeRest(argNames: string[]): string | string[] | null {
        const returnArgs: string[] = []
        argNames.forEach(element => {
            let option: string | null = null
            const tempValue = (this.message.message as Discord.CommandInteraction).options.get(element)?.value
            if (
                tempValue
            )
                option = tempValue.toString().replace(/\\n/g, "\n")
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

    consumeLength(argName: string): number | null {
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
                const gettedString = this.message.message.options.getString(argName)
                
                if (gettedString){
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let parsed: any = ms(gettedString)
                    if (parsed === undefined) parsed = Number(parsed)
                    return Number.isNaN(parsed) ? null : parsed
                }
            } catch {
                return null
            }
        }
        return null
    }

    async consumeChannel(argName: string): Promise<Discord.Channel> {
        return this.message.message.options.getChannel(argName) as Discord.Channel
    }

    async consumeUser(argName: string): Promise<Discord.User | null> {
        return this.message.message.options.getUser(argName)
    }

    async consumeRole(argName: string): Promise<Discord.Role> {
        return this.message.message.options.getRole(argName) as Discord.Role
    }

    consumeAttachment(
        check?: (attachment: Discord.MessageAttachment) => boolean
        // ill keep the lint error for now until 13.7, so i remember, so dont fix this
    ): Discord.MessageAttachment | null {
        //NOTE: USE THE ATTACHMENT STUFF WHEN 13.7 IS AVAILABLE
        return null
    }

    consumeImage(argName: string): string | null {
        //NOTE: USE THE ATTACHMENT STUFF WHEN 13.7 IS AVAILABLE
        const url = this.consumeIf(/https?:\/\/(.+)?\.(jpe?g|png|gif)/i, argName)
        if (url) {
            const match = url.match(/.(jpe?g|png|gif)/i)?.[0].toLowerCase()
            if (match)
                return url.replace(
                    /.(jpe?g|png|gif)/i,
                    match
                )
        }


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
    ): string | null {
        if (equals) {
            let arg: string | null = null

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
        return null
    }

    consumeSubcommandGroupIf(
        equals?: string | string[] | RegExp | ((arg: string) => boolean)
    ): string | null {
        if (equals) {
            let arg: string | null = null

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
        return null
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
