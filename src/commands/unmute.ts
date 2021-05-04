import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "unmute",
    aliases: [],
    description: "Unmute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to unmute!"
                    : "Couldn't find that user."
            )

        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (!mute) return message.channel.sendError("That user is not muted!")

        await mute.undo(client)

        const log = new ActionLog()
        log.action = "unmute"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        await log.notifyMember(client)
        const formattedUser = user.id === message.author.id ? "*you*" : user.toString()
        await message.channel.sendSuccess(`Unmuted ${formattedUser} (**#${log.id}**).`)
        await client.log(log)
    }
})
