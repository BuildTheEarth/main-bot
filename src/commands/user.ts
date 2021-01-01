import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatUTCDate from "../util/formatUTCDate"
import humanizeConstant from "../util/humanizeConstant"
import userFlags from "../data/userFlags"
import activityTypes from "../data/activityTypes"

export default new Command({
    name: "user",
    aliases: ["whois", "userinfo"],
    description: "Get info on someone.",
    permission: Roles.ANY,
    usage: "<user>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser(true)
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user!"
                    : "Couldn't find that user."
            )
        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)

        const embed: Discord.MessageEmbedOptions = {
            color: client.config.colors.info,
            thumbnail: {
                url: user.displayAvatarURL({ size: 64, format: "png", dynamic: true })
            },
            description: `Information on ${user}:`,
            fields: [
                {
                    name: "Tag",
                    value: Discord.Util.escapeMarkdown(user.tag),
                    inline: true
                },
                {
                    name: "ID",
                    value: user.id,
                    inline: true
                }
            ]
        }

        if (member) {
            if (member.nickname)
                embed.fields.push({
                    name: "Nick",
                    value: Discord.Util.escapeMarkdown(member.nickname),
                    inline: true
                })

            const max = 1024 / 24
            // filter out @everyone
            const roles = member.roles.cache
                .sort((a, b) => b.position - a.position)
                .filter(role => role.id !== message.guild.id)
            let formattedRoles = roles
                .map(role => `<@&${role.id}>`)
                .slice(0, max)
                .join(", ")
            if (member.roles.cache.size > max) formattedRoles += "..."
            if (formattedRoles)
                embed.fields.push({ name: "Roles", value: formattedRoles })

            const permissions = member.permissions
                .toArray(true)
                .map(name => humanizeConstant(name, ["VAD", "TTS"]))
            if (permissions)
                embed.fields.push({ name: "Permissions", value: permissions.join(", ") })
        }

        embed.fields.push({
            name: "Creation date",
            value: formatUTCDate(user.createdAt),
            inline: true
        })

        if (member)
            embed.fields.push({
                name: member ? "Join date" : "\u200B",
                value: member ? formatUTCDate(member.joinedAt) : "\u200B",
                inline: true
            })

        const typingIn: Discord.Channel = client.channels.cache.find(
            channel =>
                // @ts-ignore
                channel._typing &&
                // @ts-ignore
                channel.guild?.id === message.guild?.id &&
                // @ts-ignore
                channel._typing.has(user.id) &&
                // @ts-ignore
                channel._typing.get(user.id).elapsedTime > 0
        )

        if (typingIn) {
            const duration = Math.round(user.typingDurationIn(typingIn) / 1000)
            embed.fields.push({
                name: "Typing in",
                value: `<#${typingIn.id}>, for **${duration}** seconds.`
            })
        }

        const vc = member?.voice?.channel
        if (vc) {
            embed.fields.push({
                name: "Connected to",
                value: `**${vc.name}** (${vc.id})`
            })
        }

        if (user.flags) {
            const flags = user.flags
                .toArray()
                .map(flag => userFlags[flag] || humanizeConstant(flag))
                .join(", ")
            if (flags) embed.fields.push({ name: "Acknowledgements", value: flags })
        }

        // uh...
        const humanizeEmoji = (emoji: Discord.Emoji) =>
            !emoji.id
                ? emoji.name
                : `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`
        const humanizeStatus = (status: Discord.Activity) =>
            (status.emoji ? humanizeEmoji(status.emoji) + " " : "") +
            (status.state ? Discord.Util.escapeMarkdown(status.state) : "")
        const humanizeActivity = (act: Discord.Activity) =>
            `${activityTypes[act.type] || humanizeConstant(act.type)} **${
                act.type === "CUSTOM_STATUS"
                    ? humanizeStatus(act)
                    : Discord.Util.escapeMarkdown(act.name)
            }**`
        const activities = user.presence.activities.map(humanizeActivity).join("\n")

        const presenceStatusEmoji = client.config.emojis.text[user.presence.status]
        const presenceStatusName =
            user.presence.status === "dnd"
                ? "Do Not Disturb"
                : humanizeConstant(user.presence.status)

        const presence = `${presenceStatusEmoji} **${presenceStatusName}**\n${activities}`
        embed.fields.push({ name: "Presence", value: presence })

        await message.channel.send({ embed })
    }
})
