import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles.util"
import hexToRGB from "../util/hexToRGB.util"
import Discord from "discord.js"
import ApiTypes from "discord-api-types/v9"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "lock",
    aliases: [],
    description: "Lock the channel.",
    permission: Roles.MANAGER,
    args: [
        {
            name: "channel",
            description: "The channel to lock",
            required: false,
            optionType: "CHANNEL",
            channelTypes: [ApiTypes.ChannelType.GuildText]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const channel =
            ((await args.consumeChannel("channel")) as Discord.TextChannel) ||
            (message.channel as Discord.TextChannel)

        /*eslint-disable */
        const reason = `Locked by ${message.member.user.tag} (${message.member.id})`
        /*eslint-enable */

        await channel.permissionOverwrites.edit(message.guild.id, {
            SEND_MESSAGES: false
        }) // There is no non-hacky reason support here now

        await client.response.sendSuccess(message, `Locked ${channel}.`)
        await client.log({
            color: hexToRGB(client.config.colors.error),
            author: { name: "Locked" },
            description: `Channel ${channel} locked by ${message.member}.`
        })
    }
})
