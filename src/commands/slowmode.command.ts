import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import Discord from "discord.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "slowmode",
    aliases: [],
    description: "Set the slowmode.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
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
            return message.sendSuccessMessage("currentSlowmode", formatted)
        }

        if (slowmode < 0) return message.sendErrorMessage("slowmodeTooLow")
        else if (slowmode === 6 * 60 * 60)
            return message.sendErrorMessage("slowmodeTooHigh")
        else if (slowmode > 6 * 60 * 60)
            return message.sendErrorMessage("slowmodeTooHigh")

        await message.continue()

        const reason = `By ${message.member.user.tag} (${message.member.id})`

        ;(channel as Discord.TextChannel).setRateLimitPerUser(slowmode, reason)

        const s = slowmode === 1 ? "" : "s"
        message.sendSuccess(
            slowmode === 0
                ? message.getMessage("disabledSlowmode", channel)
                : message.getMessage("setSlowmode", channel, slowmode, s)
        )
    }
})
