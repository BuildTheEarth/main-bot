import Client from "../struct/Client"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "unmute",
    aliases: [],
    description: "Unmute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
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
                user === undefined ? client.messages.noUser : client.messages.invalidUsers
            )

        const reason = client.placeholder.replacePlaceholders(args.consumeRest(["reason"]))
        if (!reason) return client.response.sendError(message, client.messages.noReason)

        await message.continue()

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (!mute) return client.response.sendError(message, client.messages.notMuted)

        await mute.undo(client)

        const log = new ActionLog()
        log.action = "unmute"
        log.member = user.id
        log.executor = message.member.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await log.notifyMember(client)
        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await client.response.sendSuccess(
            message,
            `Unmuted ${formattedUser} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
