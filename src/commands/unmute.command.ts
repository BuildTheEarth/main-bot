import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "unmute",
    aliases: [],
    description: "Unmute a member.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
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
            return message.sendErrorMessage(
                user === undefined ? "noUser" : "invalidUsers"
            )

        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (!mute) return message.sendErrorMessage("notMuted")

        await mute.undo(client)

        const log = new ActionLog()
        log.action = "unmute"
        log.member = user.id
        log.executor = message.member.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = undefined
        await log.save()

        await log.notifyMember(client)
        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await message.sendSuccessMessage("unbannedUser", formattedUser, log.id)
        await client.log(log)
    }
})
