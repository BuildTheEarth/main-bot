import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

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
                user === undefined
                    ? "You must provide a user to mute!"
                    : "Couldn't find that user."
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (member) {
            if (member.user.bot)
                return client.response.sendError(
                    message,
                    "Look at you, hacker, a pathetic creature of meat and bone. How can you challenge a perfect, immortal machine?"
                )
            if (GuildMember.hasRole(member, Roles.STAFF))
                return client.response.sendError(
                    message,
                    "This is literally 1984. You can't mute other staff!"
                )
        }

        const length = args.consumeLength("length")
        if (length == null)
            return client.response.sendError(message, "You must provide a length!")

        const image = args.consumeImage("image_url")
        const reason = args.consumeRest(["reason"])
        if (!reason)
            return client.response.sendError(message, "You must provide a reason!")

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (mute) return client.response.sendError(message, "That user is already muted!")

        const punishment = new TimedPunishment()
        punishment.member = user.id
        punishment.type = "mute"
        punishment.length = length
        await punishment.save()
        punishment.schedule(client)

        const log = new ActionLog()
        log.action = "mute"
        log.member = user.id
        log.executor = message.member.id
        log.reason = reason
        log.reasonImage = image
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        await log.notifyMember(client)
        if (member) await GuildMember.mute(member, reason)
        const away = member ? "" : ", though they're not in the server"
        const formattedLength = formatPunishmentTime(length)
        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await client.response.sendError(
            message.channel,
            `Muted ${formattedUser} ${formattedLength} (**#${log.id}**)${away}.`
        )
        await client.log(log)
    }
})
