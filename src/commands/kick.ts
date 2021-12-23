import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import noop from "../util/noop"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "kick",
    aliases: ["boot", "expell"],
    description: "Kick a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to kick.",
            required: true,
            optionType: "USER"
        },
        {
            name: "image_url",
            description: "Kick image URL.",
            required: false,
            optionType: "STRING"
        },
        {
            name: "reason",
            description: "Kick reason.",
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
                    ? "You must provide a user to kick!"
                    : "Couldn't find that user."
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member)
            return client.response.sendError(message, "The user is not in the server!")

        if (member.user.bot)
            return client.response.sendError(
                message,
                "Look at you, hacker, a pathetic creature of meat and bone. How can you challenge a perfect, immortal machine?"
            )
        if (member.id === message.member.user.id)
            return client.response.sendError(
                message,
                "Okay, sadist, you can't kick yourself."
            )
        if (GuildMember.hasRole(member, Roles.STAFF))
            return client.response.sendError(message, "Rude! You can't kick other staff.")

        const image = args.consumeImage("image_url")
        const reason = args.consumeRest(["reason"])
        if (!reason)
            return client.response.sendError(message, "You must provide a reason!")

        await message.continue()

        const log = new ActionLog()
        log.action = "kick"
        log.member = user.id
        log.executor = message.member.user.id
        log.reason = reason
        log.reasonImage = image
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await log.notifyMember(client)
        await member.kick(
            reason.length <= 512 ? reason : (await log.contextUrl(client)).href
        )
        await client.response.sendSuccess(message, `Kicked ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})
