import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"
import punish from "../util/punish"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to mute.",
            required: true,
            optionType: "USER"
        },
        {
            name: "length",
            description: "Mute length.",
            required: true,
            optionType: "STRING"
        },
        {
            name: "image_url",
            description: "Mute image URL.",
            required: false,
            optionType: "STRING"
        },
        {
            name: "reason",
            description: "Mute reason.",
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
            .fetch({ user, cache: true })
            .catch(() => null)
        if (member) {
            if (member.user.bot)
                return client.response.sendError(message, client.messages.isBot)
            if (GuildMember.hasRole(member, Roles.STAFF))
                return client.response.sendError(message, client.messages.isStaffMute)
        }

        const length = args.consumeLength("length")
        if (length == null)
            return client.response.sendError(message, client.messages.invalidLength)

        const image = args.consumeImage("image_url")
        const reason = args.consumeRest(["reason"])
        if (!reason) return client.response.sendError(message, client.messages.noReason)

        await message.continue()

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (mute) return client.response.sendError(message, client.messages.alreadyMuted)

        const log = await punish(client, message, member, "mute", reason, image, length)

        const away = member ? "" : ", though they're not in the server"
        const formattedLength = formatPunishmentTime(length)
        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await client.response.sendError(
            message,
            `Muted ${formattedUser} ${formattedLength} (**#${log.id}**)${away}.`
        )
        await client.log(log)
    }
})
