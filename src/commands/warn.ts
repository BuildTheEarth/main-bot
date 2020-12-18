import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import DMChannel from "../struct/discord/DMChannel"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import noop from "../util/noop"

export default new Command({
    name: "warn",
    aliases: [],
    description: "Warn a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<member> [image URL | attachment] <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to warn!"
                    : "Couldn't find that user."
            )

        const image = args.consumeImage()
        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")
        const member = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (!member) return message.channel.sendError("The user is not in the server!")

        const dms = <DMChannel>await user.createDM()
        dms.sendError(`${message.author} has warned you:\n\n*${reason}*`).catch(noop)

        const log = new ActionLog()
        log.action = "warn"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.reasonImage = image
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        const formattedUser = user.id === message.author.id ? "*you*" : user.toString()
        await message.channel.sendSuccess(`Warned ${formattedUser} (**#${log.id}**).`)
        await client.log(log)
    }
})
