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
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<member> <reason>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const result = await message.guild.members.find(args.raw)
        args.raw = result.args
        const target = result.member

        if (!target)
            return message.channel.sendError(
                target === undefined
                    ? `Couldn't find user \`${result.input}\`.`
                    : `You must provide a user to warn!`
            )

        const reason = args.consumeRest()
        if (!reason) return message.channel.sendError("You must provide a reason!")

        const dms = <DMChannel>await target.user.createDM()
        dms.sendError(`${message.author} has warned you:\n\n*${reason}*`).catch(noop)

        const log = new ActionLog()
        log.action = "warn"
        log.member = target.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id

        await log.save()
        message.channel.sendSuccess(`Warned ${target.user} (**#${log.id}**)`)
    }
})
