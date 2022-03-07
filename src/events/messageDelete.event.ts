import Client from "../struct/Client.js"
import Discord from "discord.js"
import { noop } from "@buildtheearth/bot-utils"

export default async function (this: Client, message: Discord.Message): Promise<unknown> {
    if (message.partial) await message.fetch().catch(noop)

    return this.deletedMessages.add(message)
}
