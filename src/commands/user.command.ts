import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import {
    formatTimestamp,
    hexToRGB,
    humanizeConstant,
    loadSyncJSON5
} from "@buildtheearth/bot-utils"
import Command from "../struct/Command.js"
import path from "path"
import url from "url"

const userFlags = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/userFlags.json5"
    )
)
const activityTypes = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/activityTypes.json5"
    )
)
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "user",
    aliases: ["whois"],
    description: "Get info on someone.",
    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "member",
            description: "Member to lookup.",
            required: true,
            optionType: "USER"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        await message.continue()

        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)

        const embed: Discord.MessageEmbedOptions = {
            color: hexToRGB(client.config.colors.info),
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
                .toArray()
                .map(name => humanizeConstant(name, ["VAD", "TTS"]))
            if (permissions)
                embed.fields.push({ name: "Permissions", value: permissions.join(", ") })
        }

        embed.fields.push({
            name: "Creation date",
            value: formatTimestamp(user.createdAt, "f"),
            inline: true
        })

        if (member)
            embed.fields.push({
                name: member ? "Join date" : "\u200B",
                value: member ? formatTimestamp(member.joinedAt, "f") : "\u200B",
                inline: true
            })

        const vc = member?.voice?.channel
        if (vc) {
            embed.fields.push({
                name: "Connected to",
                value: `**${vc.name}** (${vc.id})`
            })
        }

        if (user.flags) {
            let feildName = "Acknowledgements"
            const flagArr = member.user.flags
                .toArray()
            const flags = flagArr
                .map(flag => userFlags[flag] || humanizeConstant(flag))
                .join(", ")
            if (flagArr.includes("DISCORD_EMPLOYEE"||"PARTNERED_SERVER_OWNER"||"HYPESQUAD_EVENTS"||"DISCORD_CERTIFIED_MODERATOR") {
                feildName += "\n(User Has a Notable Flag)"
            }
            if (flags) embed.fields.push({ name: feildName, value: flags })
            }
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
                act.type === "CUSTOM"
                    ? humanizeStatus(act)
                    : Discord.Util.escapeMarkdown(act.name)
            }**`
        const activities = member.presence.activities.map(humanizeActivity).join("\n")
        const presenceStatusEmoji = client.config.emojis.text[member.presence.status]
        const presenceStatusName =
            member.presence.status === "dnd"
                ? "Do Not Disturb"
                : humanizeConstant(member.presence.status)

        const presence = `\\${presenceStatusEmoji} **${presenceStatusName}**\n${activities}`
        embed.fields.push({ name: "Presence", value: presence })
        await message.send({ embeds: [embed] })
    }
})
