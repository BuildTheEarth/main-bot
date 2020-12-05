import Discord from "discord.js"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "slowmode",
    aliases: ["cooldown", "ratelimit"],
    description: "Set the slowmode.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<seconds> [channel]",
    async run(this: Command, client: Client, message: Message, args: string) {
        const [inputSlowmode, inputChannel] = args.split(/ +/)
        const slowmode = Math.round(Number(inputSlowmode))
        if (isNaN(slowmode)) {
            const current = (<TextChannel>message.channel).rateLimitPerUser
            const s = current === 1 ? "" : "s"
            const formatted = current === 0 ? "disabled" : `${current} second${s}`
            return message.channel.send({
                embed: {
                    color: client.config.colors.success,
                    description: `The slowmode is currently ${formatted}.`
                }
            })
        }
        const channelID = inputChannel.match(/\d{18}/)?.[0]
        const channel = <Discord.TextChannel>(
            (message.guild.channels.cache.get(channelID) || message.channel)
        )

        channel.setRateLimitPerUser(
            Number(slowmode),
            `By ${message.author.tag} (${message.author.id})`
        )

        const embed: Discord.MessageEmbedOptions = { color: client.config.colors.success }
        const s = slowmode === 1 ? "" : "s"
        if (slowmode === 0) embed.description = `Disabled slowmode in ${channel}.`
        else embed.description = `Set slowmode in ${channel} to ${slowmode} second${s}.`

        message.channel.send({ embed })
    }
})
