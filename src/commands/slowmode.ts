import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"

export default new Command({
    name: "slowmode",
    aliases: ["cooldown", "ratelimit"],
    description: "Set the slowmode.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "[seconds | 'show'] [channel]",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const firstArg = args.consume()
        const slowmode = Math.round(Number(firstArg))
        const channel =
            (await args.consumeChannel()) || (message.channel as Discord.TextChannel)
        if (isNaN(slowmode)) {
            const current = channel.rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return client.channel.sendSuccess(
                message.channel,
                `The slowmode is currently ${formatted}.`
            )
        }

        if (slowmode < 0)
            return client.channel.sendError(
                message.channel,
                "How would that even work? Time travel?"
            )
        else if (slowmode === 6 * 60 * 60)
            return client.channel.sendError(message.channel, "Please, not this again.")
        else if (slowmode > 6 * 60 * 60)
            return client.channel.sendError(message.channel, "That is a lot of seconds!")

        const reason = `By ${message.author.tag} (${message.author.id})`
        channel.setRateLimitPerUser(slowmode, reason)

        const s = slowmode === 1 ? "" : "s"
        client.channel.sendSuccess(
            message.channel,
            slowmode === 0
                ? `Disabled slowmode in ${channel}.`
                : `Set slowmode in ${channel} to ${slowmode} second${s}.`
        )
    }
})
