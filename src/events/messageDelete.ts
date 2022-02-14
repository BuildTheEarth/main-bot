import Client from "../struct/Client"
import Discord from "discord.js"
import noop from "../util/noop"

export default async function (this: Client, message: Discord.Message): Promise<unknown> {
    if (message.partial) await message.fetch().catch(noop)

    return this.deletedMessages.add(message)
}
