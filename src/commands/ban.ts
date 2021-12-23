import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import noop from "../util/noop"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

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
                user === undefined
                    ? "You must provide a user to ban!"
                    : "Couldn't find that user."
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (member) {
            if (member.user.bot)
                return client.response.sendError(
                    message,
                    "Look at you, hacker, a pathetic creature of meat and bone. How can you challenge a perfect, immortal machine?"
                )
            if (member.id === message.member.id)
                return client.response.sendError(
                    message,
                    "You can't ban yourself, cezon."
                )
            if (GuildMember.hasRole(member, Roles.STAFF))
                return client.response.sendError(
                    message,
                    "Alrighty, revolutionist, you can't ban other staff!"
                )
        }

        const length = args.consumeLength("length")
        if (length == null)
            return client.response.sendError(message, "You must provide a length!")
        const image = args.consumeImage("image_url")
        if (!image)
            return client.response.sendError(message, "You must provide a reason image!")
        const reason = args.consumeRest(["reason"])
        if (!reason)
            return client.response.sendError(message, "You must provide a reason!")

        message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (ban) return client.response.sendError(message, "The user is already banned!")

        const reviewerChannel = message.guild.channels.cache.find(
            ch => ch.name == "review-committee-private"
        ) as Discord.TextChannel
        if (member && GuildMember.hasRole(member, Roles.BUILDER) && reviewerChannel)
            client.response.sendSuccess(
                reviewerChannel,
                `Builder ${user} (${user.id}) was banned!`
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
        log.executor = message.member.id
        log.reason = reason
        log.reasonImage = image
        log.length = length
        log.channel = message.channel.id
        log.message = message.id
        log.punishment = punishment
        await log.save()

        await log.notifyMember(client)
        await message.guild.members.ban(user, {
            reason: reason.length <= 512 ? reason : (await log.contextUrl(client)).href
        })
        const formattedLength = formatPunishmentTime(length)
        await client.response.sendSuccess(
            message,
            `Banned ${user} ${formattedLength} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
