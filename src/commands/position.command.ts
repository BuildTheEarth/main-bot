import Client from "../struct/Client.js"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import Args from "../struct/Args.js"
import path from "path"
import url from "url"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Guild from "../struct/discord/Guild.js"

const pseudoteamPositions: Record<string, Record<string, string>> = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/pseudoteamPositions.json5"
    )
)
const forbiddenRoles = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/forbiddenRoles.json5"
    )
)
const roleConfig = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            `../../../config/extensions/roles/${client.config.guilds.main}.json5`
    )
)

import { noop } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"
import { config } from "process"

export default new Command({
    name: "position",
    aliases: [],
    description: "Promote/demote a member from your team.",
    permission: [
        globalThis.client.roles.SUBTEAM_LEAD,
        globalThis.client.roles.REGIONAL_BUILD_TEAM_LEAD,
        globalThis.client.roles.TEAM_OWNER_STAFF
    ],
    subcommands: [
        {
            name: "adjust",
            description: "Promote/demote a member from your team.",
            permission: [globalThis.client.roles.ANY],
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
                    choices: ["bto", "vs", "vcc", "teamstaff"]
                },
                {
                    name: "promote",
                    description: "Wheter to promote or demote",
                    optionType: "STRING",
                    required: false,
                    choices: ["promote", "demote"]
                }
            ]
        },
        {
            name: "manage",
            description: "Add or remove any role from a member.",
            permission: [
                globalThis.client.roles.MODERATOR,
                globalThis.client.roles.MANAGER
            ],
            args: [
                {
                    name: "member",
                    description: "Member to give the role.",
                    required: true,
                    optionType: "USER"
                },
                {
                    name: "role",
                    description: "Role to give to the member.",
                    required: true,
                    optionType: "ROLE"
                },
                {
                    name: "remove",
                    description: "If true the role will be removed.",
                    required: false,
                    optionType: "BOOLEAN"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = await args.consumeUser("member")
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")

        const subcommand = args.consumeSubcommand()
        if (subcommand === "manage") {
            const roleArgs = await args.consumeRole("role")
            if (!roleArgs) return message.sendErrorMessage("noRole")
            const remove = args.consumeBoolean("remove")
            const action = remove ? "remove" : "add"
            let roleName
            for (const key in roleConfig) {
                if (roleConfig[key] == roleArgs.id) {
                    roleName = key
                }
            }
            if (
                message.member.roles.highest.position < roleArgs.position ||
                forbiddenRoles.includes(roleName) ||
                message.guild.id !== client.config.guilds.main
            )
                return message.sendErrorMessage("noRolePerms")

            const member: Discord.GuildMember | null = await message.guild.members
                .fetch({ user, cache: true })
                .catch(noop)
            if (!member) return message.sendErrorMessage("notInGuild")
            await message.continue()
            await member.roles[action](roleArgs).catch(err => {
                return message.sendErrorMessage("roleFailed")
            })

            return message.sendSuccessMessage("roleSuccess")
        }

        let position = args.consumeIf(["bto", "vcc", "vs", "teamstaff"], "position")
        if (!position)
            for (const [team, lead] of Object.entries(pseudoteamPositions.leads))
                if (GuildMember.hasRole(message.member, client.roles[lead], client))
                    position = team
        if (!position) return

        const lead = pseudoteamPositions.leads[position]
        const expanded = pseudoteamPositions.expansions[position]
        const guild =
            pseudoteamPositions.guild[position] === "main"
                ? client.customGuilds.main()
                : client.customGuilds.staff()

        if (!GuildMember.hasRole(message.member, client.roles[lead], client))
            return message.sendErrorMessage("notLead", expanded)
        const role = Guild.role(guild, client.roles[expanded])

        const member: Discord.GuildMember | null = await guild.members
            .fetch({ user, cache: true })
            .catch(noop)
        if (!member) return message.sendErrorMessage("notInGuild")
        await message.continue()

        const demote = !!args.consumeIf("demote", "promote")
        const method = demote ? "remove" : "add"
        const past = demote ? "Demoted" : "Promoted"
        const preposition = demote ? "from" : "to"
        await member.roles[method](role)
        await message.sendSuccess(`${past} <@${user.id}> ${preposition} **${expanded}**!`)
        // Realistically I see no point in translating this, cause its all placeholders, and its english.
    }
})
