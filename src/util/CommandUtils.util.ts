import DBuilders = require("@discordjs/builders")
import Command, { CommandArgs, SubCommandProperties } from "../struct/Command.js"
import _ from "lodash"


export default function commandToSlash(command: Command): DBuilders.SlashCommandBuilder[] {
    const commands = []
    let builder = new DBuilders.SlashCommandBuilder()
        .setName(command.name)
        .setNameLocalizations(command.name_translations)
        .setDescription(command.description)
        .setDescriptionLocalizations(command.description_translations)
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
        baseSubCom.name_translations = baseSubCom.basesubcommand_translations
            ? baseSubCom.basesubcommand_translations
            : command.name_translations
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

    for (let aliasNum = 0; aliasNum < command.aliases.length; aliasNum++) {
        const alias = command.aliases[aliasNum]
        const aliasBuilder = _.cloneDeep(builder)
        const nameTranslations: Record<string, string> = Object.fromEntries(
            Object.entries(command.aliases_translations).map(([key, value]) => {
                return [key, value[aliasNum]]
            })
        )
        aliasBuilder.setName(alias)
        aliasBuilder.setNameLocalizations(nameTranslations)
        commands.push(aliasBuilder)
    }

    return commands
}

function addSubcommandGroup(
    subcommand: SubCommandProperties,
    globalArgs?: CommandArgs[]
): DBuilders.SlashCommandSubcommandGroupBuilder {
    const currentSlashBuilder = new DBuilders.SlashCommandSubcommandGroupBuilder()
        .setName(subcommand.name)
        .setDescription(subcommand.description)
    if (subcommand.name_translations)
        currentSlashBuilder.setNameLocalizations(subcommand.name_translations)
    if (subcommand.description_translations)
        currentSlashBuilder.setDescriptionLocalizations(
            subcommand.description_translations
        )
    subcommand.subcommands?.forEach(subSubcommand => {
        let currentSubSlashBuilder = new DBuilders.SlashCommandSubcommandBuilder()
            .setName(subSubcommand.name)
            .setDescription(subSubcommand.description)
        if (subSubcommand.name_translations)
            currentSubSlashBuilder.setNameLocalizations(subSubcommand.name_translations)
        if (subSubcommand.description_translations)
            currentSubSlashBuilder.setDescriptionLocalizations(
                subSubcommand.description_translations
            )
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
    if (subcommand.name_translations)
        currentSlashBuilder.setNameLocalizations(subcommand.name_translations)
    if (subcommand.description_translations)
        currentSlashBuilder.setDescriptionLocalizations(
            subcommand.description_translations
        )
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
            trueChoices.push({ name: choice.toString(), value: choice })
        })
    }
    if (arg.optionType === "STRING") {
        const tempBuilder = new DBuilders.SlashCommandStringOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(...trueChoices)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        if (arg.autocomplete?.enable) {
            tempBuilder.setAutocomplete(true)
        }
        if (arg.maxLenOrValue) {
            tempBuilder.setMaxLength(arg.maxLenOrValue)
        }
        if (arg.minLenOrValue) {
            tempBuilder.setMinLength(arg.minLenOrValue)
        }
        builder.addStringOption(tempBuilder)
    } else if (arg.optionType === "INTEGER") {
        const tempBuilder = new DBuilders.SlashCommandIntegerOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(...trueChoices)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        if (arg.maxLenOrValue) {
            tempBuilder.setMaxValue(arg.maxLenOrValue)
        }
        if (arg.minLenOrValue) {
            tempBuilder.setMinValue(arg.minLenOrValue)
        }
        builder.addIntegerOption(tempBuilder)
    } else if (arg.optionType === "NUMBER") {
        const tempBuilder = new DBuilders.SlashCommandNumberOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (trueChoices) tempBuilder.addChoices(...trueChoices)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        if (arg.maxLenOrValue) {
            tempBuilder.setMaxValue(arg.maxLenOrValue)
        }
        if (arg.minLenOrValue) {
            tempBuilder.setMinValue(arg.minLenOrValue)
        }
        builder.addNumberOption(tempBuilder)
    } else if (arg.optionType === "BOOLEAN") {
        const tempBuilder = new DBuilders.SlashCommandBooleanOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        builder.addBooleanOption(tempBuilder)
    } else if (arg.optionType === "USER") {
        const tempBuilder = new DBuilders.SlashCommandUserOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        builder.addUserOption(tempBuilder)
    } else if (arg.optionType === "CHANNEL") {
        const tempBuilder = new DBuilders.SlashCommandChannelOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        if (arg.channelTypes) {
            if (arg.channelTypes instanceof Array)
                tempBuilder.addChannelTypes(...arg.channelTypes)
            else tempBuilder.addChannelTypes(arg.channelTypes)
        } //hacky fix, but works
        builder.addChannelOption(tempBuilder)
    } else if (arg.optionType === "ROLE") {
        const tempBuilder = new DBuilders.SlashCommandRoleOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        builder.addRoleOption(tempBuilder)
    } else if (arg.optionType === "MENTIONABLE") {
        const tempBuilder = new DBuilders.SlashCommandMentionableOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        builder.addMentionableOption(tempBuilder)
    } else if (arg.optionType === "ATTACHMENT") {
        const tempBuilder = new DBuilders.SlashCommandAttachmentOption()
            .setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required)
        if (arg.name_translations) tempBuilder.setNameLocalizations(arg.name_translations)
        if (arg.description_translations)
            tempBuilder.setDescriptionLocalizations(arg.description_translations)
        builder.addAttachmentOption(tempBuilder)
    }
    return builder
}


