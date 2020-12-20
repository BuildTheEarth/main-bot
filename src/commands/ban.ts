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
    name: "ban",
    aliases: [],
    description: "Ban a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> <length> <image URL | attachment> <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to ban!"
                    : "Couldn't find that user."
            )

        const length = args.consumeLength()
        if (length == null) return message.channel.sendError("You must provide a length!")
        const image = args.consumeImage()
        if (!image) return message.channel.sendError("You must provide a reason image!")
        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const ban = await TimedPunishment.findOne({
            where: { member: user.id, type: "ban" }
        })
        if (ban) return message.channel.sendError("The user is already banned!")

        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (member && member.hasStaffPermission(Roles.STAFF))
            return message.channel.sendError(
                member.id === message.author.id
                    ? "You can't ban yourself, cezon."
                    : "Alrighty, revolutionist, you can't ban other staff!"
            )

        const punishment = new TimedPunishment()
        punishment.member = user.id
        punishment.type = "ban"
        punishment.length = length
        await punishment.save()
        punishment.schedule(client)

        const log = new ActionLog()
        log.action = "ban"
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
        await dms.send({ embed: log.displayUserEmbed(client) }).catch(noop)
        await message.guild.members.ban(user, { reason })

        await message.channel.sendSuccess(
            `Banned ${user} ${formattedLength} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
