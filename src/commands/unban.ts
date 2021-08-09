import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "unban",
    aliases: [],
    description: "Unban a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> <reason>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user to unban!"
                    : "Couldn't find that user."
            )

        const reason = args.consumeRest()
        if (!reason)
            return client.channel.sendError(message.channel, "You must provide a reason!")

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (!ban)
            return client.channel.sendError(message.channel, "The user is not banned!")

        await ban.undo(client)
        const log = new ActionLog()
        log.action = "unban"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await client.channel.sendSuccess(
            message.channel,
            `Unbanned ${user} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
