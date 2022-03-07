import Client from "../struct/Client.js"
import Discord from "discord.js"
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import { noop } from "@buildtheearth/bot-utils"

export default async function (
    this: Client,
    oldMessage: Discord.Message,
    newMessage: Discord.Message
): Promise<unknown> {
    if (newMessage.partial) await newMessage.fetch().catch(noop)

    if (newMessage.author.bot) return

    const bannedWords = this.filter.findBannedWord(newMessage.content)
    if (bannedWords.length >= 1)
        return ModerationMenu.createMenu(newMessage, bannedWords, this)
}
