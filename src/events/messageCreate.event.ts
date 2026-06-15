import { hexToNum, noop } from "@buildtheearth/bot-utils"
import crypto from "crypto"
import { Message, MessageType } from "discord.js"
import fetch from "node-fetch"
import typeorm from "typeorm"
import { runBtCommand } from "../commands/team.command.js"
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import Snippet from "../entities/Snippet.entity.js"
import BotClient from "../struct/BotClient.js"
import languages from "../struct/client/iso6391.js"
import BotGuild from "../struct/discord/BotGuild.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import chalk = require("chalk")

const ATTACHMENT_DUPLICATE_WINDOW = 30_000
const recentAttachmentHashes: Map<string, number> = new Map()

function consumeCommand(client: BotClient, message: Message): string {
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

function consumeLang(client: BotClient, message: Message): string {
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

function consumeTeam(client: BotClient, message: Message): string {
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

function clearOldAttachmentHashes(now: number): void {
    for (const [hash, timestamp] of recentAttachmentHashes) {
        if (now - timestamp > ATTACHMENT_DUPLICATE_WINDOW) {
            recentAttachmentHashes.delete(hash)
        }
    }
}

async function getAttachmentHash(url: string): Promise<string | null> {
    const attachmentFetch = await fetch(url).catch(noop)
    if (!attachmentFetch?.ok) return null
    const arrayBuffer = await attachmentFetch.arrayBuffer().catch(() => null)
    if (!arrayBuffer) return null
    return crypto.createHash("sha256").update(new Uint8Array(arrayBuffer)).digest("hex")
}

export default async function (this: BotClient, message: Message): Promise<unknown> {
    if (message.partial) await message.fetch().catch(noop)
    if (message.author.bot) return
    const Snippets = Snippet.getRepository()

    const mainGuild = await this.customGuilds.main()
    const main = mainGuild.id === message.guild?.id
    if (main && message.type === MessageType.GuildBoostTier3) {
        await BotGuild.setVanityCode()
        this.logger.info(`Set vanity code to ${chalk.hex("#FF73FA")(this.config.vanity)}`)
        return
    }

    if (message.content.startsWith(this.config.prefix)) {
        const command = this.customCommands.search(consumeCommand(this, message))
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

            if (message.channel.isSendable())
                await message.channel
                    .send({ content: snippet.body, allowedMentions: { parse: [] } })
                    .catch(() => null)

            return
        }

        if (command.name === "team") {
            const team = consumeTeam(this, message)
            if (!team || team === "")
                return this.response.sendError(
                    message,
                    this.messages.getMessage("noTeam", "en-US")
                )
            return await runBtCommand(this, message, team)
        }

        return // do Absolutely Nothing
    }

    const suggestions = Object.values(this.config.suggestions)
    if (
        suggestions.includes(message.channel.id) &&
        message.member &&
        !BotGuildMember.hasRole(message.member, globalThis.client.roles.MANAGER, this)
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

    if (
        message.content.toLowerCase() === "donde es server" &&
        message.channel.isSendable()
    )
        return await message.channel.send("hay un server!")
    if (message.content) {
        const bannedWords = this.filter.findBannedWord(message.content)
        if (bannedWords.length >= 1 && message.guild?.id === this.config.guilds.main) {
            return ModerationMenu.createMenu(message, bannedWords, this)
        }
    }
    if (main && message.attachments.size > 0) {
        const attachmentCount = message.attachments.size

        // if (attachmentCount == 2 || attachmentCount == 4) {
        //     message.attachments.forEach(attachment => {
        //         getAttachmentHash(attachment.url).then(async hash => {
        //             if (!hash) return
        //             const now = Date.now()
        //             clearOldAttachmentHashes(now)

        //             const previous = recentAttachmentHashes.get(hash)
        //             recentAttachmentHashes.set(hash, now)
        //             if (previous && now - previous <= ATTACHMENT_DUPLICATE_WINDOW) {
        //                 message.delete().catch(noop)
        //                 const bannedWords = this.filter.findBannedWord("SUS_ATTACHMENT")

        //                 if (bannedWords.length >= 1) {
        //                     return ModerationMenu.createMenu(message, bannedWords, this)
        //                 } else {
        //                     await client.log({
        //                         color: hexToNum(client.config.colors.info),
        //                         author: { name: "Attachment Delete" },
        //                         description: `Message with ${attachmentCount} attachments by ${message.member} in ${message.channel} deleted. No moderation action found.`
        //                     })
        //                 }
        //             }
        //         })
        //     })
        // }
        if (attachmentCount === 2 || attachmentCount === 4) {
            const messageHashes = new Set<string>()

            for (const attachment of message.attachments.values()) {
                const hash = await getAttachmentHash(attachment.url)
                if (!hash) continue
                if (messageHashes.has(hash)) continue

                messageHashes.add(hash)
                const now = Date.now()
                clearOldAttachmentHashes(now)

                const previous = recentAttachmentHashes.get(hash)
                recentAttachmentHashes.set(hash, now)
                if (previous && now - previous <= ATTACHMENT_DUPLICATE_WINDOW) {
                    const bannedWords = this.filter.findBannedWord("SUS_ATTACHMENT")
                    if (bannedWords.length >= 1) {
                        await ModerationMenu.createMenu(message, bannedWords, this)
                    } else {
                        await message.delete().catch(noop)
                        await this.log({
                            color: hexToNum(this.config.colors.info),
                            author: { name: "Attachment Delete" },
                            description: `Message with ${attachmentCount} attachments by ${message.member} in ${message.channel} deleted. No moderation action found.`
                        })
                        break
                    }
                }
            }
        }
    }
}
