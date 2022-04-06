import Client from "../struct/Client.js"
import Discord from "discord.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"

import { noop } from "@buildtheearth/bot-utils"
import CommandMessage from "../struct/CommandMessage.js"
import punish from "../util/punish.util.js"

export default new Command({
    name: "kick",
    aliases: [],
    description: "Kick a member.",
    permission: [globalThis.client.roles.MODERATOR, globalThis.client.roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to kick.",
            required: true,
            optionType: "USER"
        },
        {
            name: "image_url",
            description: "Kick image URL.",
            required: false,
            optionType: "STRING"
        },
        {
            name: "reason",
            description: "Kick reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: false })
            .catch(noop)
        if (!member) return message.sendErrorMessage("notInGuild")

        if (member.user.bot) return message.sendErrorMessage("isBot")
        if (member.id === message.member.user.id)
            return message.sendErrorMessage("isSelfKick")
        if (GuildMember.hasRole(member, globalThis.client.roles.STAFF, client))
            return message.sendErrorMessage("isStaffKick")

        const image = args.consumeImage("image_url")
        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const length = null
        const log = await punish(client, message, user, "kick", reason, image, length)

        await client.response.sendSuccess(message, `Kicked ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})
