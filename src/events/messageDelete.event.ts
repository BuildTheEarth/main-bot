import { Message } from "discord.js"
import BotClient from "../struct/BotClient.js"
import { noop } from "@buildtheearth/bot-utils"

export default async function (this: BotClient, message: Message): Promise<unknown> {
    if (message.partial) await message.fetch().catch(noop)

    return this.deletedMessages.add(message)
}
