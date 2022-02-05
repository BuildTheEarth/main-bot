import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import noop from "../util/noop"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"
import punish from "../util/punish"

export default new Command({
    name: "ban",
    aliases: [],
    description: "Ban a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to ban.",
            required: true,
            optionType: "USER"
        },
        {
            name: "length",
            description: "Ban length.",
            required: true,
            optionType: "STRING"
        },
        {
            name: "image_url",
            description: "Ban image URL (required if used as slashcommand).",
            required: true,
            optionType: "STRING"
        },
        {
            name: "reason",
            description: "Ban reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")

        if (!user)
            return client.response.sendError(
                message,
                user === undefined ? client.messages.noUser : client.messages.invalidUser
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: false })
            .catch(noop)

        if (member) {
            if (member.user.bot)
                return client.response.sendError(message, client.messages.isBot)
            if (member.id === message.member.id)
                return client.response.sendError(message, client.messages.isSelfBan)
            if (GuildMember.hasRole(member, Roles.STAFF, client))
                return client.response.sendError(message, client.messages.isStaffBan)
        }

        const length = args.consumeLength("length")
        if (length == null)
            return client.response.sendError(message, client.messages.noLength)
        const image = args.consumeImage("image_url")
        if (!image) return client.response.sendError(message, client.messages.noImage)
        const reason = args.consumeRest(["reason"])
        if (!reason) return client.response.sendError(message, client.messages.noReason)

        await message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (ban) return client.response.sendError(message, client.messages.alreadyBanned)

        const log = await punish(client, message, user, "ban", reason, image, length)

        const formattedLength = formatPunishmentTime(length)
        await client.response.sendSuccess(
            message,
            `Banned ${user} ${formattedLength} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
