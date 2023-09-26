import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Guild from "../struct/discord/Guild.js"
import Snippet from "../entities/Snippet.entity.js"
import languages from "../struct/client/iso6391.js"

import chalk = require("chalk")
import { noop } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import typeorm from "typeorm"
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import { runBtCommand } from "../commands/team.command.js"
import CommandAction from "../entities/CommandAction.entity.js"

function consumeCommand(client: Client, message: Discord.Message): string {
    const content = message.content
    const prefix = client.config.prefix
    const prefixLength = prefix.length
    if (content.length < prefixLength) return ""
    if (content.substring(0, prefixLength) !== prefix) return ""

    const command = content.substring(prefixLength)
    const commandSplit = command.split(" ")
    const commandName = commandSplit[0]
    return commandName || ""
}

function consumeLang(client: Client, message: Discord.Message): string {
    const content = message.content
    const prefix = client.config.prefix
    const prefixLength = prefix.length
    if (content.length < prefixLength) return ""
    if (content.substring(0, prefixLength) !== prefix) return ""

    const command = content.substring(prefixLength)
    const commandSplit = command.split(" ")
    const commandName = commandSplit[1]
    return commandName || ""
}

function consumeTeam(client: Client, message: Discord.Message): string {
    const content = message.content
    const prefix = client.config.prefix
    const prefixLength = prefix.length
    if (content.length < prefixLength) return ""
    if (content.substring(0, prefixLength) !== prefix) return ""

    const command = content.substring(prefixLength)
    const commandSplit = command.split(" ")
    commandSplit.shift()
    return commandSplit.join(" ").trim() || ""
}

export default async function (this: Client, message: Discord.Message): Promise<unknown> {
    if (message.partial) await message.fetch().catch(noop)
    if (message.author.bot) return
    const Snippets = Snippet.getRepository()

    const mainGuild = await this.customGuilds.main()
    const main = mainGuild.id === message.guild?.id
    if (main && message.type === Discord.MessageType.GuildBoostTier3) {
        await Guild.setVanityCode(
            message.guild,
            this.config.vanity,
            "Reached level 3 boosting"
        )
        this.logger.info(`Set vanity code to ${chalk.hex("#FF73FA")(this.config.vanity)}`)
        return
    }

    if (message.content.startsWith(this.config.prefix)) {
        const command = this.commands.search(consumeCommand(this, message))
        if (!command) {
            const firstArg = consumeLang(this, message).toLowerCase() //before someone kills me, this is guaranteed to be of a normal message as it is in messageCreate, so we strictly dont need an arg name but i am NOT making that an optional arg
            const languageName = languages.getName(firstArg) || "English"
            const language = languages.validate(firstArg) ? firstArg.toLowerCase() : "en"

            if (firstArg.toLowerCase() === "zh")
                return this.response.sendError(
                    message,
                    `Please choose \`zh-s\` (简体中文) or \`zh-t\` (繁體中文)!`
                )

            const find = (query: typeorm.WhereExpression) =>
                query
                    .where("snippet.name = :name", {
                        name: consumeCommand(this, message)
                    })
                    .andWhere("snippet.type = 'snippet'")
                    .orWhere(
                        new typeorm.Brackets(qb => {
                            qb.where("FIND_IN_SET(:name, snippet.aliases)").andWhere(
                                "snippet.type = 'snippet'"
                            )
                        })
                    )

            const snippet = await Snippets.createQueryBuilder("snippet")
                .where("snippet.language = :language", { language })
                .andWhere(new typeorm.Brackets(find))
                .andWhere("snippet.type = 'snippet'")
                .getOne()

            if (!snippet) {
                const unlocalizedSnippet = await Snippets.createQueryBuilder("snippet")
                    .where(new typeorm.Brackets(find))
                    .andWhere("snippet.type = 'snippet'")
                    .getOne()
                if (unlocalizedSnippet)
                    this.response.sendError(
                        message,
                        `The **${consumeCommand(
                            this,
                            message
                        )}** snippet hasn't been translated to ${languageName} yet.`
                    )
                return
            }

            await message.channel.send(snippet.body).catch(() => null)

            const cInfo = new CommandAction()
            cInfo.channel = message.channel.id
            cInfo.command = "executed_snippet"
            cInfo.subcommand = snippet.language
            cInfo.subcommandGroup = snippet.name
            cInfo.guild = message.guildId ?? "00000000000000000"
            cInfo.executor = message.author.id
            await cInfo.save()
            return
        }

        if (command.name === "team") {
            const team = consumeTeam(this, message)
            if (!team || team === "")
                return client.response.sendError(
                    message,
                    client.messages.getMessage("noTeam", "en-US")
                )
            return await runBtCommand(client, message, team)
        }

        return // do Absolutely Nothing
    }

    const suggestions = Object.values(this.config.suggestions)
    if (
        suggestions.includes(message.channel.id) &&
        message.member &&
        !GuildMember.hasRole(message.member, globalThis.client.roles.MANAGER, this)
    ) {
        const error = await this.response.sendError(
            message,
            `Please use the \`suggest\` command to post suggestions! (Check \`${this.config.prefix}help suggest\` for help). **Your message will be deleted in 30 seconds.**`
        )

        setTimeout(() => message.delete(), 30000)
        setTimeout(() => {
            if (error) error.delete()
        }, 30000)
        return
    }

    if (message.content.toLowerCase() === "donde es server")
        return await message.channel.send("hay un server!")
    if (message.content) {
        const bannedWords = this.filter.findBannedWord(message.content)
        if (bannedWords.length >= 1 && message.guild?.id === this.config.guilds.main)
            return ModerationMenu.createMenu(message, bannedWords, this)
    }
}
