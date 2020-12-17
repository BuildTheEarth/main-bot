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
        const member = await message.guild.members.fetch({ user, cache: true })
        if (!member) return message.channel.sendError("That user is not in the server!")

        const existingMute = await TimedPunishment.findOne({
            where: { member: user.id, type: "mute" }
        })
        if (existingMute) return message.channel.sendError("That user is already muted!")

        if (member.hasStaffPermission(Roles.STAFF) && member.id !== message.author.id)
            return message.channel.sendError("You can't mute other staff!")

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
        log.reasonImage = image
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        const formattedUser = user.id === message.author.id ? "*you*" : user.toString()
        // prettier-ignore
        await message.channel.sendSuccess(`Muted ${formattedUser} ${formattedLength} (**#${log.id}**).`)
        await client.log(log)
    }
})
