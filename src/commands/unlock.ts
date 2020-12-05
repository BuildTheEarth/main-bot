import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "unlock",
    aliases: [],
    description: "Unlock the channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, client: Client, message: Message, args: string) {
        const channelID = args.match(/\d{18}/)?.[0]
        const channel = <TextChannel>(
            (message.guild.channels.cache.get(channelID) || message.channel)
        )
        await channel.updateOverwrite(
            message.guild.id,
            { SEND_MESSAGES: null },
            `Unlocked by ${message.author.tag} (${message.author.id})`
        )
        message.channel.send({
            embed: {
                color: client.config.colors.success,
                description: `Unlocked ${channel}.`
            }
        })
    }
})
