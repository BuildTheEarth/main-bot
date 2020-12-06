import ms from "ms"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Guild from "../struct/discord/Guild"
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
        const result = await message.guild.members.find(args.raw)
        args.raw = result.args
        const target = result.member

        if (!target)
            return message.channel.sendError(
                target === undefined
                    ? `Couldn't find user \`${result.input}\`.`
                    : `You must provide a user to mute!`
            )

        const length = ms(args.consume() || "0") || 0
        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        await target.mute(reason)
        const formattedLength = formatPunishmentTime(length)
        const dms = <DMChannel>await target.user.createDM()
        dms.sendError(
            `${message.author} has muted you ${formattedLength}:\n\n*${reason}*`
        ).catch(noop)

        const punishment = new TimedPunishment()
        punishment.member = target.id
        punishment.type = "mute"
        punishment.length = length
        await punishment.save()
        punishment.schedule(client)

        const log = new ActionLog()
        log.action = "mute"
        log.member = target.id
        log.executor = message.author.id
        log.reason = reason
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        // prettier-ignore
        message.channel.sendSuccess(`Muted ${target.user} ${formattedLength} (**#${log.id}**)`)
    }
})
