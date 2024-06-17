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
            channelTypes: [
                ApiTypes.ChannelType.GuildText,
                ApiTypes.ChannelType.GuildCategory,
                ApiTypes.ChannelType.GuildVoice,
                ApiTypes.ChannelType.GuildNews,
                ApiTypes.ChannelType.GuildStageVoice
            ]
        },
        {
            name: "bypass",
            description: "Bypass the channel permission check",
            required: false,
            optionType: "BOOLEAN"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        if (!client.user) return
        const channel = (await args.consumeChannel("channel")) || message.channel
        if (channel.isDMBased()) return message.sendErrorMessage("dmBased")
        const bypass = args.consumeBoolean("bypass") || false
        const perms =
            (channel as Discord.TextChannel)
                .permissionsFor(message.member)
                .has(Discord.PermissionFlagsBits.ViewChannel) &&
            (channel as Discord.TextChannel)
                .permissionsFor(client.user)
                ?.has(Discord.PermissionFlagsBits.ViewChannel)

        if (bypass) {
            const managerChat = client.customGuilds
                .staff()
                .channels.cache.find(ch => ch.name == "management") as Discord.TextChannel
            if (managerChat)
                await client.response.sendError(
                    managerChat,
                    `**ALERT:** ${message.author} bypassed the channel permission check to give themselves Manage Permissions in ${channel}!`
                )
        } else {
            if (!perms) return message.sendErrorMessage("noChannelPerms")
        }

        await message.continue()

        const manager = Guild.role(message.guild, globalThis.client.roles.MANAGER)
        /*eslint-disable */
        const reason = `Access requested by ${message.member.user.tag} (${message.member.id})`
        /*eslint-enable */
        await (channel as Discord.TextChannel).permissionOverwrites.edit(manager, {
            ManageRoles: true,
            ViewChannel: true,
            ManageChannels: true
        }) // There is no non-hacky reason support here now

        await message.sendSuccessMessage("gaveChannelPerms", channel)
    }
})
