import { loadJSON5 } from "@buildtheearth/bot-utils"
import fs from "fs"
import pathModule from "path"
import url from "url"
import Command, {
    CommandArgsTranslation,
    SubCommandProperties,
    SubCommandTranslation,
    CommandArgs
} from "../struct/Command.js"
import getLocaleMapping from "./localeMapper.js"

export default abstract class TranslateUtils {
    public static async injectTranslations(command: Command): Promise<Command> {
        try {
            const langFiles = await fs.promises.readdir(
                `${pathModule.dirname(
                    url.fileURLToPath(import.meta.url)
                )}/../../config/extensions/commands/${command.name}`
            )
            for (const langFile of langFiles) {
                const lang = langFile.replace(".json5", "")
                const discordLang = getLocaleMapping(lang)
                if (!discordLang) return command
                const translations: {
                    translated_name: string
                    translated_aliases: string[]
                    translated_description: string
                    translated_basesubcommand?: string
                    subcommands?: SubCommandTranslation[]
                    args?: CommandArgsTranslation[]
                } = await loadJSON5(
                    `${pathModule.dirname(
                        url.fileURLToPath(import.meta.url)
                    )}/../../config/extensions/commands/${command.name}/${langFile}`
                )

                if (!translations) return command
                if (!command.name_translations) command.name_translations = {}
                if (!command.description_translations)
                    command.description_translations = {}
                if (!command.aliases_translations) command.aliases_translations = {}
                if (!command.basesubcommand_translations && command.basesubcommand)
                    command.basesubcommand_translations = {}
                for (const realLang of discordLang) {
                    command.name_translations[realLang] = translations.translated_name
                    command.description_translations[realLang] =
                        translations.translated_description
                    command.aliases_translations[realLang] = [
                        ...translations.translated_aliases,
                        ...command.aliases.slice(
                            translations.translated_aliases.length -
                                command.aliases.length
                        )
                    ]
                    if (
                        command.basesubcommand &&
                        command.basesubcommand_translations &&
                        translations.translated_basesubcommand
                    )
                        command.basesubcommand_translations[realLang] =
                            translations.translated_basesubcommand

                    if (command.subcommands && translations.subcommands) {
                        for (
                            let subcommandNum = 0;
                            subcommandNum < command.subcommands.length;
                            subcommandNum++
                        ) {
                            const subcommand = command.subcommands[subcommandNum]
                            const subComTranslations =
                                translations.subcommands[subcommandNum]
                            command.subcommands[subcommandNum] =
                                TranslateUtils.injectSubcommand(
                                    subcommand,
                                    realLang,
                                    subComTranslations
                                )
                        }
                    }
                    if (command.args && translations.args) {
                        for (let argsNum = 0; argsNum < command.args.length; argsNum++) {
                            const arg = command.args[argsNum]
                            const argTranslations = translations.args[argsNum]
                            command.args[argsNum] = TranslateUtils.injectArg(
                                arg,
                                realLang,
                                argTranslations
                            )
                        }
                    }
                }
            }
            return command
        } catch (e) {
            return command
        }
    }

    public static injectSubcommand(
        subcommand: SubCommandProperties,
        lang: string,
        translated: SubCommandTranslation
    ): SubCommandProperties {
        if (!subcommand.name_translations) subcommand.name_translations = {}
        if (!subcommand.description_translations) subcommand.description_translations = {}

        if (translated.translated_name)
            subcommand.name_translations[lang] = translated.translated_name

        if (translated.translated_description)
            subcommand.description_translations[lang] = translated.translated_description
        if (subcommand.args && translated.args) {
            for (let argNum = 0; argNum < subcommand.args.length; argNum++) {
                const arg = subcommand.args[argNum]
                const translatedArg = translated.args[argNum]
                subcommand.args[argNum] = TranslateUtils.injectArg(
                    arg,
                    lang,
                    translatedArg
                )
            }
        }
        if (subcommand.subcommands && translated.subcommands && subcommand.group) {
            for (
                let subcommandNum = 0;
                subcommandNum < subcommand.subcommands.length;
                subcommandNum++
            ) {
                const subcommandNested = subcommand.subcommands[subcommandNum]
                const translatedSubcommandNested = translated.subcommands[subcommandNum]
                subcommand.subcommands[subcommandNum] = TranslateUtils.injectSubcommand(
                    subcommandNested,
                    lang,
                    translatedSubcommandNested
                )
            }
        }

        return subcommand
    }

    public static injectArg(
        arg: CommandArgs,
        lang: string,
        translated: CommandArgsTranslation
    ): CommandArgs {
        if (!arg.description_translations) arg.description_translations = {}
        if (!arg.name_translations) arg.name_translations = {}
        if (translated.translated_description)
            arg.description_translations[lang] = translated.translated_description
        if (translated.translated_name)
            arg.name_translations[lang] = translated.translated_name

        return arg
    }
}
