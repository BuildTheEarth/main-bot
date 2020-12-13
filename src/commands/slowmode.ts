import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import TextChannel from "../struct/discord/TextChannel"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "slowmode",
    aliases: ["cooldown", "ratelimit"],
    description: "Set the slowmode.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "[seconds | 'show'] [channel]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const firstArg = args.consumeIf(a => a.toLowerCase() === "show") || args.consume()
        const slowmode = Math.round(Number(firstArg))
        const channel = (await args.consumeChannel()) || <TextChannel>message.channel
        if (firstArg.toLowerCase() === "show" || isNaN(slowmode) || !firstArg) {
            const current = channel.rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return message.channel.sendSuccess(`The slowmode is currently ${formatted}.`)
        }

        channel.setRateLimitPerUser(
            Number(slowmode),
            `By ${message.author.tag} (${message.author.id})`
        )

        const s = slowmode === 1 ? "" : "s"
        message.channel.sendSuccess(
            slowmode === 0
                ? `Disabled slowmode in ${channel}.`
                : `Set slowmode in ${channel} to ${slowmode} second${s}.`
        )
    }
})
