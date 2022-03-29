import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import Discord from "discord.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "slowmode",
    aliases: [],
    description: "Set the slowmode.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "time",
            description: "Slowmode duration in seconds.",
            optionType: "NUMBER",
            required: false
        },
        {
            name: "channel",
            description: "The channel to activate slowmode in",
            required: false,
            optionType: "CHANNEL",
            channelTypes: [ApiTypes.ChannelType.GuildText]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const firstArg = args.consume("time")
        const slowmode = Math.round(Number(firstArg))
        const channel =
            (await args.consumeChannel("channel")) ||
            (message.channel as Discord.TextChannel)
        if (isNaN(slowmode)) {
            const current = (channel as Discord.TextChannel).rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return client.response.sendSuccess(
                message,
                `The slowmode is currently ${formatted}.`
            )
        }

        if (slowmode < 0)
            return client.response.sendError(message, message.messages.slowmodeTooLow)
        else if (slowmode === 6 * 60 * 60)
            return client.response.sendError(message, message.messages.slowmodeTooHigh)
        else if (slowmode > 6 * 60 * 60)
            return client.response.sendError(message, message.messages.slowmodeTooHigh)

        await message.continue()

        const reason = `By ${message.member.user.tag} (${message.member.id})`

        ;(channel as Discord.TextChannel).setRateLimitPerUser(slowmode, reason)

        const s = slowmode === 1 ? "" : "s"
        client.response.sendSuccess(
            message,
            slowmode === 0
                ? `Disabled slowmode in ${channel}.`
                : `Set slowmode in ${channel} to ${slowmode} second${s}.`
        )
    }
})
