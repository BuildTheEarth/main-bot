import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import ApiTypes from "discord-api-types/v9"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "access",
    aliases: [],
    description: "Enable the Manage Permissions permission for a channel.",
    permission: Roles.MANAGER,
    args: [
        {
            name: "channel",
            description: "The channel to get permissions for",
            required: true,
            optionType: "CHANNEL",
            channelTypes: [ApiTypes.ChannelType.GuildText]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const channel = (await args.consumeChannel("channel")) || message.channel
        const perms = (channel as Discord.TextChannel).permissionsFor(message.member)
        if (!perms.has("VIEW_CHANNEL"))
            return client.response.sendError(message, client.messages.noChannelPerms)

        await message.continue()

        const manager = Guild.role(message.guild, Roles.MANAGER)
        /*eslint-disable */
        const reason = `Access requested by ${message.member.user.tag} (${message.member.id})`
        /*eslint-enable */
        await (channel as Discord.TextChannel).permissionOverwrites.edit(manager, {
            MANAGE_ROLES: true
        }) // There is no non-hacky reason support here now

        await client.response.sendSuccess(
            message,
            `Gave managers permission in ${channel}.`
        )
    }
})
