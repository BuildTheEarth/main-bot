import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"

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
                user === undefined ? message.messages.noUser : message.messages.invalidUser
            )

        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return client.response.sendError(message, message.messages.noReason)

        await message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (!ban) return client.response.sendError(message, message.messages.notBanned)

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
