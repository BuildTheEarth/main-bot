import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import punish from "../util/punish.util.js"

export default new Command({
    name: "warn",
    aliases: [],
    description: "Warn a member.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
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
            return message.sendErrorMessage(
                user === undefined ? "noUser" : "invalidUsers"
            )

        const image = args.consumeImage("image_url")
        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")
        const member: Discord.GuildMember | null = await message.guild.members
            .fetch({ user, cache: false })
            .catch(() => null)
        if (!member) return message.sendErrorMessage("notInGuild")

        await message.continue()

        const length = null
        const log = await punish(client, message, user, "warn", reason, image, length)

        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await message.sendSuccessMessage("warnedUser", formattedUser, log.id)
        await client.log(log)
    }
})
