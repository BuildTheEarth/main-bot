import BotClient from "../struct/BotClient.js"
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import { noop } from "@buildtheearth/bot-utils"
import { Message } from "discord.js"

export default async function (
    this: BotClient,
    oldMessage: Message,
    newMessage: Message
): Promise<unknown> {
    if (newMessage?.partial) await newMessage.fetch().catch(noop)

    if (newMessage?.author?.partial) await newMessage.author.fetch().catch(noop)

    if (newMessage?.author?.bot) return

    //just weird redundancy

    if (oldMessage?.author?.bot) return

    if (oldMessage.content === newMessage.content) return

    const HOUR = 1000 * 60 * 60;
    const anHourAgo = Date.now() - HOUR

    if (newMessage.createdAt < anHourAgo) return

    if (newMessage.content) {
        const bannedWords = this.filter.findBannedWord(newMessage.content)
        if (bannedWords.length >= 1 && newMessage.guild?.id === this.config.guilds.main)
            return ModerationMenu.createMenu(newMessage, bannedWords, this)
    }
}
