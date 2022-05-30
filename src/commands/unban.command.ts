import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "unban",
    aliases: [],
    description: "Unban a member.",
    permission: [globalThis.client.roles.MODERATOR, globalThis.client.roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to unban.",
            required: true,
            optionType: "USER"
        },
        {
            name: "reason",
            description: "Unban reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (!ban) return message.sendErrorMessage("notBanned")

        await ban.undo(client)
        const log = new ActionLog()
        log.action = "unban"
        log.member = user.id
        log.executor = message.member.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = undefined
        await log.save()

        await message.sendSuccessMessage("unbannedUser", user, log.id)
        await client.log(log)
    }
})
