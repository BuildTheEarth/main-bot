import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"

import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"
import punish from "../util/punish.util.js"
import { formatPunishmentTime, noop } from "@buildtheearth/bot-utils"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [
        globalThis.client.roles.HELPER,
        globalThis.client.roles.MODERATOR,
        globalThis.client.roles.MANAGER
    ],
    args: [
        {
            name: "member",
            description: "Member to mute.",
            required: true,
            optionType: "USER"
        },
        {
            name: "length",
            description: "Mute length.",
            required: true,
            optionType: "STRING"
        },
        {
            name: "image_url",
            description: "Mute image URL.",
            required: false,
            optionType: "ATTACHMENT"
        },
        {
            name: "reason",
            description: "Mute reason.",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")
        const member: Discord.GuildMember | null = await message.guild.members
            .fetch({ user, cache: false })
            .catch(noop)
        if (member) {
            if (member.user.bot) return message.sendErrorMessage("isBot")
            if (GuildMember.hasRole(member, globalThis.client.roles.STAFF, client))
                return message.sendErrorMessage("isStaffMute")
        }

        const length = args.consumeLength("length")
        if (length == null || length < 0) return message.sendErrorMessage("invalidLength")

        const image = args.consumeImage("image_url")
        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const mute = await TimedPunishment.findOne({ member: user.id, type: "mute" })
        if (mute) return message.sendErrorMessage("alreadyMuted")

        const log = await punish(client, message, user, "mute", reason, image, length)

        const away = member ? "" : ", though they're not in the server"
        const formattedLength = formatPunishmentTime(length)
        const formattedUser = user.id === message.member.id ? "*you*" : user.toString()
        await message.sendErrorMessageSeen(
            "mutedMessage",
            formattedUser,
            formattedLength,
            log.id,
            away
        )
        await client.log(log)
    }
})
