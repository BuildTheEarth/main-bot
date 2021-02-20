import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import TextChannel from "../struct/discord/TextChannel"
import Roles from "../util/roles"

export default new Command({
    name: "lock",
    aliases: [],
    description: "Lock the channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const channel = (await args.consumeChannel()) || (message.channel as TextChannel)
        const reason = `Locked by ${message.author.tag} (${message.author.id})`
        await channel.updateOverwrite(message.guild.id, { SEND_MESSAGES: false }, reason)

        await message.channel.sendSuccess(`Locked ${channel}.`)
        await client.log({
            color: client.config.colors.error,
            author: { name: "Locked" },
            description: `Channel ${channel} locked by ${message.author}.`
        })
    }
})
