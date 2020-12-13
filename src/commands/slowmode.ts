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
    usage: "<seconds> [channel]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const inputSlowmode = args.consume()
        const slowmode = Math.round(Number(inputSlowmode))
        if (isNaN(slowmode)) {
            const current = (<TextChannel>message.channel).rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return message.channel.sendSuccess(`The slowmode is currently ${formatted}.`)
        }

        const channel = (await args.consumeChannel()) || <TextChannel>message.channel
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
