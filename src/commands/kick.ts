import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import noop from "../util/noop"

export default new Command({
    name: "kick",
    aliases: ["boot"],
    description: "Kick a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> [image URL | attachment] <reason>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user to kick!"
                    : "Couldn't find that user."
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member)
            return client.channel.sendError(
                message.channel,
                "The user is not in the server!"
            )

        if (member.user.bot)
            return client.channel.sendError(
                message.channel,
                "Look at you, hacker, a pathetic creature of meat and bone. How can you challenge a perfect, immortal machine?"
            )
        if (member.id === message.author.id)
            return client.channel.sendError(
                message.channel,
                "Okay, sadist, you can't kick yourself."
            )
        if (GuildMember.hasRole(member, Roles.STAFF))
            return client.channel.sendError(
                message.channel,
                "Rude! You can't kick other staff."
            )

        const image = args.consumeImage()
        let reason = args.consumeRest()
        if (!reason)
            return client.channel.sendError(message.channel, "You must provide a reason!")
        const autoFill = type => reason = `Please change your ${type} and come back.`

        if (reason.toLowerCase() === "username") autoFill("username")
        if (reason.toLowerCase() === "pfp") autoFill("profile photo")
        if (reason.toLowerCase() === "status") autoFill("status")

        const log = new ActionLog()
        log.action = "kick"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.reasonImage = image
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await log.notifyMember(client)
        await member.kick(reason)
        await client.channel.sendSuccess(
            message.channel,
            `Kicked ${user} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
