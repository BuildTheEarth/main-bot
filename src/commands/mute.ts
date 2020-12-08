import ms from "ms"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import DMChannel from "../struct/discord/DMChannel"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"
import noop from "../util/noop"
import formatPunishmentTime from "../util/formatPunishmentTime"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<member> <length> <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to mute!"
                    : "Couldn't find that user."
            )

        const length = ms(args.consume() || "0") || 0
        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const member = message.guild.member(user)
        if (!member) return message.channel.sendError("The user is not in the server!")

        const existingMute = await TimedPunishment.findOne({
            where: { member: user.id, type: "mute" }
        })
        if (existingMute) return message.channel.sendError("The user is already muted!")

        if (member.hasStaffPermission(Roles.STAFF))
            return message.channel.sendError(
                member.id === message.author.id
                    ? "You can't mute yourself..."
                    : "You can't mute other staff!"
            )

        await member.mute(reason)
        const formattedLength = formatPunishmentTime(length)
        const dms = <DMChannel>await user.createDM()
        dms.sendError(
            `${message.author} has muted you ${formattedLength}:\n\n*${reason}*`
        ).catch(noop)

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
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        message.channel.sendSuccess(`Muted ${user} ${formattedLength} (**#${log.id}**)`)
    }
})
