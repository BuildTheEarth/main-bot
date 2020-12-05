import ms from "ms"
import Client from "../struct/Client"
import Guild from "../struct/discord/Guild"
import DMChannel from "../struct/discord/DMChannel"
import Message from "../struct/discord/Message"
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
    async run(this: Command, client: Client, message: Message, args: string) {
        const result = await (<Guild>message.guild).members.find(args)
        args = result.args
        const target = result.member

        if (!target)
            return message.channel.sendError(
                target === undefined
                    ? `Couldn't find user \`${result.input}\`.`
                    : `You must provide a user to mute!`
            )

        if (target.hasStaffPermission(Roles.STAFF))
            return message.channel.sendError(
                target.id === message.author.id
                    ? "You can't mute yourself..."
                    : "You can't mute other staff!"
            )

        const length = ms(args.split(" ")[0] || "0") || 0
        const reason = args.split(" ").slice(1).join(" ").trim()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        if (length !== 0) {
            const punishment = new TimedPunishment()
            punishment.member = target.id
            punishment.type = "mute"
            punishment.end = Date.now() + length
            await punishment.save()
            punishment.schedule(client)
        }

        await target.mute(reason)
        const formattedLength = formatPunishmentTime(length)

        // prettier-ignore
        message.channel.sendSuccess(`Muted \`${target.user.tag}\` ${formattedLength} • *${reason}*`)
        const dms = <DMChannel>target.user.dmChannel
        // prettier-ignore
        dms.sendError(`${message.author} has muted you ${formattedLength}:\n\n*${reason}*`)
            .catch(noop)

        const log = new ActionLog()
        log.action = "mute"
        log.member = target.id
        log.executor = message.author.id
        log.reason = reason
        log.length = length
        log.channel = message.channel.id
        log.message = message.id

        log.save()
    }
})
