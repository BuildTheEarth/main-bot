import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"
import formatPunishmentTime from "../util/formatPunishmentTime"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> <length> [image URL | attachment] <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to mute!"
                    : "Couldn't find that user."
            )

        const length = args.consumeLength()
        if (length == null) return message.channel.sendError("You must provide a length!")

        const image = args.consumeImage()
        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")
        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (mute) return message.channel.sendError("That user is already muted!")
        if (
            member &&
            member.hasStaffPermission(Roles.STAFF) &&
            member.id !== message.author.id
        )
            return message.channel.sendError("You can't mute other staff!")

        if (member) await member.mute(reason)

        const punishment = new TimedPunishment()
        punishment.member = user.id
        punishment.type = "mute"
        punishment.length = length
        await punishment.save()
        punishment.schedule(client)

        const log = new ActionLog()
        log.action = "mute"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.reasonImage = image
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        const formattedLength = formatPunishmentTime(length)
        const dms = await user.createDM()
        dms.send({ embed: log.displayUserEmbed(client) }).catch(noop)

        const away = member ? "" : ", though they're not in the server"
        const formattedUser = user.id === message.author.id ? "*you*" : user.toString()
        await message.channel.sendSuccess(
            `Muted ${formattedUser} ${formattedLength} (**#${log.id}**)${away}.`
        )
        await client.log(log)
    }
})
