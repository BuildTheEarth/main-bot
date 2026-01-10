import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import Command from "../struct/Command.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import CommandMessage from "../struct/CommandMessage.js"
import punish from "../util/punish.util.js"
import { formatPunishmentTime, noop } from "@buildtheearth/bot-utils"
import { GuildMember } from "discord.js"

export default new Command({
    name: "ban",
    aliases: [],
    description: "Ban a member.",
    permission: [globalThis.client.roles.MODERATOR, globalThis.client.roles.MANAGER],
    args: [
        {
            name: "member",
            description: "Member to ban.",
            required: true,
            optionType: "USER"
        },
        {
            name: "length",
            description: "Ban length.",
            required: true,
            optionType: "STRING"
        },
        {
            name: "image_url",
            description: "Ban image URL (required if used as slashcommand).",
            required: true,
            optionType: "ATTACHMENT"
        },
        {
            name: "reason",
            description: "Ban reason.",
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

        if (member) {
            if (member.user.bot) return message.sendErrorMessage("isBot")
            if (member.id === message.member.id)
                return message.sendErrorMessage("isSelfBan")
            if (BotGuildMember.hasRole(member, globalThis.client.roles.STAFF, client))
                return message.sendErrorMessage("isStaffBan")
        }

        const length = args.consumeLength("length")
        if (length == null || length < 0) return message.sendErrorMessage("noLength")
        const image = args.consumeImage("image_url")
        if (!image) return message.sendErrorMessage("noImage")
        const reason = client.placeholder.replacePlaceholders(
            args.consumeRest(["reason"])
        )
        if (!reason) return message.sendErrorMessage("noReason")

        await message.continue()

        const ban = await TimedPunishment.findOne({ member: user.id, type: "ban" })
        if (ban) return message.sendErrorMessage("alreadyBanned")

        const log = await punish(client, message, user, "ban", reason, image, length)

        const formattedLength = formatPunishmentTime(length)
        await message.sendSuccessMessage("bannedMessage", user, formattedLength, log.id)
        await client.log(log)
    }
})
