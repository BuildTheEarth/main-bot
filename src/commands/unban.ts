import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "unban",
    aliases: [],
    description: "Unban a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to ban.",
            required: true,
            optionType: "USER"
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
                    ? "You must provide a user to unban!"
                    : "Couldn't find that user."
            )

        const reason = args.consumeRest(["reason"])
        if (!reason)
            return client.response.sendError(message, "You must provide a reason!")

        await message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (!ban) return client.response.sendError(message, "The user is not banned!")

        await ban.undo(client)
        const log = new ActionLog()
        log.action = "unban"
        log.member = user.id
        log.executor = message.member.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await client.response.sendSuccess(message, `Unbanned ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})
