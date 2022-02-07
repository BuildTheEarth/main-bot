import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import punish from "../util/punish"

export default new Command({
    name: "warn",
    aliases: [],
    description: "Warn a member.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to warn.",
            required: true,
            optionType: "USER"
        },
        {
            name: "image_url",
            description: "Warn image URL.",
            required: false,
            optionType: "STRING"
        },
        {
            name: "reason",
            description: "Warn reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")

        if (!user)
            return client.response.sendError(
                message.channel,
                user === undefined ? client.messages.noUser : client.messages.invalidUser
            )

        const image = args.consumeImage("image_url")
        const reason = client.placeholder.replacePlaceholders(args.consumeRest(["reason"]))
        if (!reason) return client.response.sendError(message, client.messages.noReason)
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: false })
            .catch(() => null)
        if (!member) return client.response.sendError(message, client.messages.notInGuild)

        await message.continue()

        const length = null
        const log = await punish(client, message, user, "warn", reason, image, length)

        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await client.response.sendSuccess(
            message,
            `Warned ${formattedUser} (**#${log.id}**).`
        )
        await client.log(log)
    }
})
