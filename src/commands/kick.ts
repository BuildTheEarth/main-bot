import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import DMChannel from "../struct/discord/DMChannel"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import noop from "../util/noop"

export default new Command({
    name: "kick",
    aliases: ["boot"],
    description: "Kick a member.",
    permission: Roles.MODERATOR,
    usage: "<member> <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to kick!"
                    : "Couldn't find that user."
            )

        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const member = message.guild.member(user)
        if (!member) return message.channel.sendError("The user is not in the server!")
        const dms = <DMChannel>await user.createDM()
        dms.sendError(`${message.author} has kicked you:\n\n*${reason}*`).catch(noop)
        await member.kick()

        const log = new ActionLog()
        log.action = "kick"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id

        await log.save()
        message.channel.sendSuccess(`Kicked ${user} (**#${log.id}**).`)
    }
})
