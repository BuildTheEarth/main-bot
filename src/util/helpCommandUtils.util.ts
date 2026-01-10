import { APIEmbed } from "discord.js"
import Command, { CommandArgs, SubCommandProperties } from "../struct/Command.js"
import _ from "lodash"
import BotClient from "../struct/BotClient.js"

export default function getHelpMessage(
    command: Command,
    slashcommand: boolean,
    client: BotClient
): APIEmbed {
    let text = `**${command.name}**\n${command.description}`
    const commandPrefix = (slashcommand ? "/" : client.config.prefix) + command.name

    // eslint-disable-next-line no-empty
    if (slashcommand && command.subcommands && command.subcommands.length > 0) {
    } else if (command.subcommands && command.subcommands.length === 0) {
        text += `\n\n**Usage**\n` + "`" + commandPrefix + " "
        if (command.args) text += argsToStrCommand(command, slashcommand)
        text += "`"
    }
    if (command.aliases.length > 0)
        text +=
            "\n\n**Aliases**\n" +
            command.aliases.map(alias => "`" + alias + "`").join(", ")
    if (command.subcommands && command.subcommands.length >= 1)
        text += argsToStrSubCommand(command, slashcommand, client)

    return { description: text }
}

function argsToStrCommand(command: Command, slashcommand: boolean): string {
    let trueSeperator = " "
    if (!slashcommand && command.seperator) trueSeperator = command.seperator
    let args = ""
    let argList = _.cloneDeep(command.args)
    if (slashcommand)
        argList = argList?.sort((x, y) => {
            return Number(y.required) - Number(x.required)
        })
    argList?.forEach(arg => {
        if (arg.required) args += "<"
        else args += "["
        if (arg.choices)
            args += arg.choices
                .map(arg => {
                    return `'${arg.toString()}'`
                })
                .join(" | ")
        else args += arg.name.toString()
        if (arg.required) args += ">" + trueSeperator
        else args += "]" + trueSeperator
    })

    return rstrip(args, trueSeperator)
}

function argsToStrSubCommand(
    command: Command,
    slashcommand: boolean,
    client: BotClient
): string {
    let args = "\n\n**Subcommands**\n"
    const subcommands: Array<SubCommandProperties> | null = _.cloneDeep(
        command.subcommands
    )
    if (slashcommand && command.basesubcommand) {
        const pushCmd = _.cloneDeep(command)
        pushCmd.name = command.basesubcommand
        pushCmd.subcommands = null
        subcommands?.push(pushCmd)
    }
    subcommands?.forEach(subcommand => {
        let trueSeperator = " "
        if (command.seperator === " " && !slashcommand && subcommand.seperator)
            trueSeperator = subcommand.seperator
        else if (!slashcommand && command.seperator) trueSeperator = command.seperator
        args += `**• ${subcommand.name}:** ${subcommand.description}\n`
        if (subcommand.subcommands)
            subcommand.subcommands.forEach(subsubcommand => {
                if (command.seperator === " " && !slashcommand && subsubcommand.seperator)
                    trueSeperator = subsubcommand.seperator
                else if (!slashcommand && command.seperator)
                    trueSeperator = command.seperator
                args += `   *${subsubcommand.name}:* ${subsubcommand.description}\n`
                let argList: CommandArgs[] = []
                if (subsubcommand.args) argList.push(...subsubcommand.args)
                if (slashcommand) {
                    argList = argList.sort((x, y) => {
                        return Number(y.required) - Number(x.required)
                    })
                    args += "   `" + `/${command.name} `
                } else args += "    `" + `${client.config.prefix}${command.name} `
                if (command.inheritGlobalArgs && !slashcommand)
                    command.args?.forEach(arg => {
                        if (arg.required) args += "<"
                        else args += "["

                        if (arg.choices)
                            args += arg.choices
                                .map(arg => {
                                    return `'${arg.toString()}'`
                                })
                                .join(" | ")
                        else args += arg.name.toString()
                        if (arg.required) args += ">" + trueSeperator
                        else args += "]" + trueSeperator
                    })
                else if (command.inheritGlobalArgs)
                    argList.push(...(command.args ? command.args : []))
                args += subcommand.name + " " + subsubcommand.name + " "
                argList.forEach(arg => {
                    if (arg.required) args += "<"
                    else args += "["

                    if (arg.choices)
                        args += arg.choices
                            .map(arg => {
                                return `'${arg.toString()}'`
                            })
                            .join(" | ")
                    else args += arg.name.toString()
                    if (arg.required) args += ">" + trueSeperator
                    else args += "]" + trueSeperator
                })
                args = rstrip(args, trueSeperator)
                args += "`\n\n"
            })
        else {
            let argList: CommandArgs[] = []
            if (subcommand.args) argList.push(...subcommand.args)
            if (slashcommand) {
                argList = argList.sort((x, y) => {
                    return Number(y.required) - Number(x.required)
                })
                args += "`" + `/${command.name} `
            } else args += "`" + `${client.config.prefix}${command.name} `
            if (command.inheritGlobalArgs && !slashcommand)
                command.args?.forEach(arg => {
                    if (arg.required) args += "<"
                    else args += "["

                    if (arg.choices)
                        args += arg.choices
                            .map(arg => {
                                return `'${arg.toString()}'`
                            })
                            .join(" | ")
                    else args += arg.name.toString()
                    if (arg.required) args += ">" + trueSeperator
                    else args += "]" + trueSeperator
                })
            else if (command.inheritGlobalArgs)
                argList.push(...(command.args ? command.args : []))
            args += subcommand.name + " "
            argList.forEach(arg => {
                if (arg.required) args += "<"
                else args += "["

                if (arg.choices)
                    args += arg.choices
                        .map(arg => {
                            return `'${arg.toString()}'`
                        })
                        .join(" | ")
                else args += arg.name.toString()
                if (arg.required) args += ">" + trueSeperator
                else args += "]" + trueSeperator
            })
            args = rstrip(args, trueSeperator)
            args += "`\n\n"
        }
    })

    return args
}

//impl of python rstrip cause there dosent seem to be any good alternative in js, yes I did steal this from stackoveflow and modify it so TS dosent yell at me
function rstrip(str: string, characters: string) {
    let end = str.length - 1
    while (characters.indexOf(str[end]) >= 0) {
        end -= 1
    }
    return str.substr(0, end + 1)
}
