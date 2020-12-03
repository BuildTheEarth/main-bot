import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "lock",
    aliases: [],
    description: "Lock the channel.",
    permission: Roles.MANAGER,
    usage: "[channel]",
    async run(this: Command, client: Client, message: Discord.Message, args: string) {
        const channelID = args.match(/\d{18}/)?.[0]
        const channel = <Discord.TextChannel>(
            (message.guild.channels.cache.get(channelID) || message.channel)
        )
        await channel.updateOverwrite(
            message.guild.id,
            { SEND_MESSAGES: false },
            `Locked by ${message.author.tag} (${message.author.id})`
        )
        message.channel.send({
            embed: {
                color: client.config.colors.success,
                description: `Locked ${channel}.`
            }
        })
    }
})
