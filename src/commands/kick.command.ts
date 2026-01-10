import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"

import { noop } from "@buildtheearth/bot-utils"
import CommandMessage from "../struct/CommandMessage.js"
import punish from "../util/punish.util.js"
import { GuildMember } from "discord.js"

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
            optionType: "ATTACHMENT"
        },
        {
            name: "reason",
            description: "Kick reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")
        const member: GuildMember | null = await message.guild.members
            .fetch({ user, cache: false })
            .catch(noop)
        if (!member) return message.sendErrorMessage("notInGuild")

        if (member.user.bot) return message.sendErrorMessage("isBot")
        if (member.id === message.member.user.id)
            return message.sendErrorMessage("isSelfKick")
        if (BotGuildMember.hasRole(member, globalThis.client.roles.STAFF, client))
            return message.sendErrorMessage("isStaffKick")

        const image = args.consumeImage("image_url")
        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const length = null
        const log = await punish(client, message, user, "kick", reason, image, length)

        await message.sendSuccessMessage("kickedUser", user, log.id)
        await client.log(log)
    }
})
