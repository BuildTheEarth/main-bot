import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Guild from "../struct/discord/Guild.js"

import ApiTypes = require("discord-api-types/v10")
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "access",
    aliases: [],
    description: "Enable the Manage Permissions permission for a channel.",
    permission: globalThis.client.roles.MANAGER,
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
        const perms =
            (channel as Discord.TextChannel)
                .permissionsFor(message.member)
                .has("VIEW_CHANNEL") &&
            (channel as Discord.TextChannel)
                .permissionsFor(client.user)
                .has("VIEW_CHANNEL")
        if (!perms) return message.sendErrorMessage("noChannelPerms")

        await message.continue()

        const manager = Guild.role(message.guild, globalThis.client.roles.MANAGER)
        /*eslint-disable */
        const reason = `Access requested by ${message.member.user.tag} (${message.member.id})`
        /*eslint-enable */
        await (channel as Discord.TextChannel).permissionOverwrites.edit(manager, {
            MANAGE_ROLES: true
        }) // There is no non-hacky reason support here now

        message.sendSuccessMessage("gaveChannelPerms", channel)
    }
})
