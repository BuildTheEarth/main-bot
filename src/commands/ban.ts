import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import noop from "../util/noop"
import TextChannel from "../struct/discord/TextChannel"

export default new Command({
    name: "ban",
    aliases: ["begone", "gtfo", "getrekt"],                     // These were suggestions from moderators themselves :heart_eyes_cat: 
    description: "Ban a member. Like a boss.",
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

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (ban) return message.channel.sendError("The user is already banned!")

        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (member && member.hasRole(Roles.STAFF))
            return message.channel.sendError(
                member.id === message.author.id
                    ? "You can't ban yourself, cezon."
                    : "Alrighty, revolutionist, you can't ban other staff!"
            )

        const reviewerChannel = message.guild.channels.cache.find(
            ch => ch.name == "reviewer-committee"
        ) as TextChannel
        if (member && member.hasRole(Roles.BUILDER) && reviewerChannel)
            reviewerChannel.sendSuccess(`Builder ${user} (${user.id}) was banned!`)

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

        await log.notifyMember(client)
        await message.guild.members.ban(user, { reason })
        const formattedLength = formatPunishmentTime(length)
        await message.channel.sendSuccess(
            `Banned ${user} ${formattedLength} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
