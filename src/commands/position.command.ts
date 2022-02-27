import Client from "../struct/Client"
import { loadSyncJSON5 } from "../util/loadJSON5.util"
import Args from "../struct/Args"
import path from "path"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles.util"
const pseudoteamPositions: Record<string, Record<string, string>> = loadSyncJSON5(
    path.join(__dirname + "../../../config/extensions/pseudoteamPositions.json5")
)
import noop from "../util/noop.util"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "position",
    aliases: ["promote", "demote", "vcc", "vs", "bto"],
    description: "Promote/demote a member from your team.",
    permission: [Roles.SUBTEAM_LEAD, Roles.REGIONAL_BUILD_TEAM_LEAD],
    args: [
        {
            name: "member",
            description: "Member to promote/demote.",
            optionType: "USER",
            required: true
        },
        {
            name: "position",
            description: "Position to promote/demote to.",
            optionType: "STRING",
            required: false,
            choices: ["bto", "vs", "vcc"]
        },
        {
            name: "promote",
            description: "Wheter to promote or demote",
            optionType: "STRING",
            required: false,
            choices: ["promote", "demote"]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return client.response.sendError(
                message,
                user === undefined ? client.messages.noUser : client.messages.invalidUser
            )

        let position = args.consumeIf(["bto", "vcc", "vs"], "position")
        if (!position)
            for (const [team, lead] of Object.entries(pseudoteamPositions.leads))
                if (GuildMember.hasRole(message.member, lead, client)) position = team
        if (!position) return

        const lead = pseudoteamPositions.leads[position]
        const expanded = pseudoteamPositions.expansions[position]

        if (!GuildMember.hasRole(message.member, lead, client))
            return client.response.sendError(
                message,
                `You can't manage members in the **${expanded}** team!`
            )
        const role = Guild.role(await client.customGuilds.main(), expanded)

        const member: Discord.GuildMember = await (
            await client.customGuilds.main()
        ).members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member) return client.response.sendError(message, client.messages.notInGuild)

        await message.continue()

        const demote = !!args.consumeIf("demote", "promote")
        const method = demote ? "remove" : "add"
        const past = demote ? "Demoted" : "Promoted"
        const preposition = demote ? "from" : "to"
        await member.roles[method](role)
        await client.response.sendSuccess(
            message,
            `${past} <@${user.id}> ${preposition} **${expanded}**!`
        )
    }
})
