import DBuilders = require("@discordjs/builders")
import Command, { CommandArgs, SubCommandProperties } from "../struct/Command.js"
import _ from "lodash"
import Discord from "discord.js"
import Client from "../struct/Client.js"

export default abstract class CommandUtils {
    public static commandToSlash(command: Command): DBuilders.SlashCommandBuilder[] {
        const commands = []
        let builder = new DBuilders.SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description)
            .setDefaultPermission(false)
        if (command.subcommands) {
            command.subcommands.forEach(subcommand => {
                if (subcommand.group) {
                    if (command.inheritGlobalArgs)
                        return builder.addSubcommandGroup(
                            addSubcommandGroup(subcommand, command.args)
                        )
                    return builder.addSubcommandGroup(addSubcommandGroup(subcommand))
                } else {
                    if (command.inheritGlobalArgs)
                        return builder.addSubcommand(
                            addSubcommand(subcommand, command.args)
                        )
                    return builder.addSubcommand(addSubcommand(subcommand))
                }
            })
        }

        if (command.basesubcommand) {
            const baseSubCom = _.cloneDeep(command)
            baseSubCom.name = baseSubCom.basesubcommand
                ? baseSubCom.basesubcommand
                : command.name
            builder.addSubcommand(addSubcommand(baseSubCom))
        }

        if (
            command.subcommands &&
            command.subcommands.length == 0 &&
            !command.basesubcommand
        )
            if (command.args)
                _.cloneDeep(command.args)
                    .sort((x, y) => {
                        return Number(y.required) - Number(x.required)
                    })
                    .forEach(arg => {
                        builder = addOption(builder, arg)
                    })

        commands.push(_.cloneDeep(builder))

        command.aliases.forEach(alias => {
            commands.push(_.cloneDeep(builder).setName(alias))
        })

        return commands
    }

    public static getHelpMessage(
        command: Command,
        slashcommand: boolean,
        client: Client
    ): Discord.MessageEmbedOptions {
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
    client: Client
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

function addSubcommandGroup(
    subcommand: SubCommandProperties,
    globalArgs?: CommandArgs[]
): DBuilders.SlashCommandSubcommandGroupBuilder {
    const currentSlashBuilder = new DBuilders.SlashCommandSubcommandGroupBuilder()
        .setName(subcommand.name)
        .setDescription(subcommand.description)
    subcommand.subcommands?.forEach(subSubcommand => {
        let currentSubSlashBuilder = new DBuilders.SlashCommandSubcommandBuilder()
            .setName(subSubcommand.name)
            .setDescription(subSubcommand.description)
        let argList: CommandArgs[] = []
        if (subSubcommand.args) argList = _.cloneDeep(subSubcommand.args)
        if (globalArgs) argList.push(...globalArgs)
        argList
            .sort((x, y) => {
                return Number(y.required) - Number(x.required)
            })
            .forEach(arg => {
                currentSubSlashBuilder = addOption(currentSubSlashBuilder, arg)
            })
        currentSlashBuilder.addSubcommand(currentSubSlashBuilder)
    })
    return currentSlashBuilder
}

function addSubcommand(
    subcommand: SubCommandProperties,
    globalArgs?: CommandArgs[]
): DBuilders.SlashCommandSubcommandBuilder {
    let currentSlashBuilder = new DBuilders.SlashCommandSubcommandBuilder()
        .setName(subcommand.name)
        .setDescription(subcommand.description)
    let argList: CommandArgs[] = []
    if (subcommand.args) argList = _.cloneDeep(subcommand.args)
    if (globalArgs) argList.push(...globalArgs)
    argList
        .sort((x, y) => {
            return Number(y.required) - Number(x.required)
        })
        .forEach(arg => {
            currentSlashBuilder = addOption(currentSlashBuilder, arg)
        })

    return currentSlashBuilder
}

function addOption(
    builder: DBuilders.SlashCommandSubcommandBuilder,
    arg: CommandArgs
): DBuilders.SlashCommandSubcommandBuilder
function addOption(
    builder: DBuilders.SlashCommandBuilder,
    arg: CommandArgs
): DBuilders.SlashCommandBuilder
function addOption(
    builder: DBuilders.SlashCommandSubcommandBuilder | DBuilders.SlashCommandBuilder,
    arg: CommandArgs
): DBuilders.SlashCommandSubcommandBuilder | DBuilders.SlashCommandBuilder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let trueChoices: any = null
    if (arg.choices) {
        trueChoices = []
        arg.choices.forEach(choice => {
            trueChoices.push([choice.toString(), choice])
        })
    }
    if (arg.optionType === "STRING") {
        const tempBuilder = new DBuilders.SlashCommandStringOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(trueChoices)
        builder.addStringOption(tempBuilder)
    } else if (arg.optionType === "INTEGER") {
        const tempBuilder = new DBuilders.SlashCommandIntegerOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(trueChoices)
        builder.addIntegerOption(tempBuilder)
    } else if (arg.optionType === "NUMBER") {
        const tempBuilder = new DBuilders.SlashCommandNumberOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(trueChoices)
        builder.addNumberOption(tempBuilder)
    } else if (arg.optionType === "BOOLEAN") {
        const tempBuilder = new DBuilders.SlashCommandBooleanOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        builder.addBooleanOption(tempBuilder)
    } else if (arg.optionType === "USER") {
        const tempBuilder = new DBuilders.SlashCommandUserOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        builder.addUserOption(tempBuilder)
    } else if (arg.optionType === "CHANNEL") {
        const tempBuilder = new DBuilders.SlashCommandChannelOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)

        if (arg.channelTypes) tempBuilder.addChannelTypes(arg.channelTypes as []) //hacky fix, but works
        builder.addChannelOption(tempBuilder)
    } else if (arg.optionType === "ROLE") {
        const tempBuilder = new DBuilders.SlashCommandRoleOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        builder.addRoleOption(tempBuilder)
    } else if (arg.optionType === "MENTIONABLE") {
        const tempBuilder = new DBuilders.SlashCommandMentionableOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        builder.addMentionableOption(tempBuilder)
    }
    return builder
}

//impl of python rstrip cause there dosent seem to be any good alternative in js, yes I did steal this from stackoveflow and modify it so TS dosent yell at me
function rstrip(str: string, characters: string) {
    let end = str.length - 1
    while (characters.indexOf(str[end]) >= 0) {
        end -= 1
    }
    return str.substr(0, end + 1)
}
