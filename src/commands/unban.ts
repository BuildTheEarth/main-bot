import Client from "../struct/Client"
import Message from "../struct/discord/Message"
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
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to unban!"
                    : "Couldn't find that user."
            )

        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (!ban) return message.channel.sendError("The user is not banned!")

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

        await message.channel.sendSuccess(`Unbanned ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})
