import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"

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

        const member: GuildMember = await message.guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (!member) return message.channel.sendError("That user is not in the server!")

        const mute = await TimedPunishment.findOne({
            where: { member: user.id, type: "mute" }
        })
        if (!mute) return message.channel.sendError("That user is not muted!")

        await mute.undo(client)
        await mute.remove()

        const log = new ActionLog()
        log.action = "unmute"
        log.member = user.id
        log.executor = message.author.id
        log.reason = reason
        log.channel = message.channel.id
        log.message = message.id
        log.length = null
        await log.save()

        const dms = await user.createDM()
        dms.send({ embed: log.displayUserEmbed(client) }).catch(noop)

        const formattedUser = user.id === message.author.id ? "*you*" : user.toString()
        await message.channel.sendSuccess(`Unmuted ${formattedUser} (**#${log.id}**).`)
        await client.log(log)
    }
})
