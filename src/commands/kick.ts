import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"
import CommandMessage from "../struct/CommandMessage"
import punish from "../util/punish"

export default new Command({
    name: "kick",
    aliases: ["boot", "expell"],
    description: "Kick a member.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
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
            return client.response.sendError(
                message,
                user === undefined ? client.messages.noUser : client.messages.invalidUser
            )
        const member: Discord.GuildMember = await message.guild.members
            .fetch({ user, cache: false })
            .catch(noop)
        if (!member) return client.response.sendError(message, client.messages.notInGuild)

        if (member.user.bot)
            return client.response.sendError(message, client.messages.isBot)
        if (member.id === message.member.user.id)
            return client.response.sendError(message, client.messages.isSelfKick)
        if (GuildMember.hasRole(member, Roles.STAFF, client))
            return client.response.sendError(message, client.messages.isStaffKick)

        const image = args.consumeImage("image_url")
        const reason = args.consumeRest(["reason"])
        if (!reason) return client.response.sendError(message, client.messages.noReason)

        await message.continue()

        const length = null
        const log = await punish(client, message, user, "kick", reason, image, length)

        await client.response.sendSuccess(message, `Kicked ${user} (**#${log.id}**).`)
        await client.log(log)
    }
})
