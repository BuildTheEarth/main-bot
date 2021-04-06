import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TextChannel from "../struct/discord/TextChannel"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "Slowmode",
    aliases: ["cooldown", "ratelimit"],
    description: "Set the slowmode in a particular chat",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "[seconds | 'show'] [channel]",
    async run(this: Command, _client: Client, message: Message, args: Args) {
        const firstArg = args.consume()
        const slowmode = Math.round(Number(firstArg))
        const channel = (await args.consumeChannel()) || (message.channel as TextChannel)
        if (isNaN(slowmode)) {
            const current = channel.rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return message.channel.sendSuccess(`The slowmode is currently ${formatted}.`)
        }

        if (slowmode < 0)
            return message.channel.sendError("How would that even work? Time travel? :rolling_eyes:")
        else if (slowmode === 6 * 60 * 60)
            return message.channel.sendError("Please, not this again.")
        else if (slowmode > 6 * 60 * 60)
            return message.channel.sendError("That is a lot of seconds!")

        const reason = `By ${message.author.tag} (${message.author.id})`
        channel.setRateLimitPerUser(slowmode, reason)

        const s = slowmode === 1 ? "" : "s"
        message.channel.sendSuccess(
            slowmode === 0
                ? `Disabled slowmode in ${channel}.`
                : `Set slowmode in ${channel} to ${slowmode} second${s}.`
        )
    }
})
