import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import pseudoteamPositions from "../data/pseudoteamPositions"
import noop from "../util/noop"
import Discord from "discord.js"

export default new Command({
    name: "position",
    aliases: ["promote", "demote", "vcc", "vs", "bto"],
    description: "Promote/demote a member from your team.",
    permission: [Roles.SUBTEAM_LEAD, Roles.REGIONAL_BUILD_TEAM_LEAD],
    usage: "<member> ['bto' | 'vcc' | 'vs'] ['promote' | 'demote']",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const user = await args.consumeUser()
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user to manage!"
                    : "Couldn't find that user."
            )

        let position = args.consumeIf(["bto", "vcc", "vs"])
        if (!position)
            for (const [team, lead] of Object.entries(pseudoteamPositions.leads))
                if (GuildMember.hasRole(message.member, lead)) position = team
        if (!position) return

        const lead = pseudoteamPositions.leads[position]
        const expanded = pseudoteamPositions.expansions[position]

        if (!GuildMember.hasRole(message.member, lead))
            return client.channel.sendError(
                message.channel,
                `You can't manage members in the **${expanded}** team!`
            )
        const role = Guild.role(client.customGuilds.main(), expanded)

        const member: Discord.GuildMember = await client.customGuilds
            .main()
            .members.fetch({ user, cache: true })
            .catch(noop)
        if (!member)
            return client.channel.sendError(
                message.channel,
                "The user is not in the server!"
            )

        const demote = !!args.consumeIf("demote")
        const method = demote ? "remove" : "add"
        const past = demote ? "Demoted" : "Promoted"
        const preposition = demote ? "from" : "to"
        await member.roles[method](role)
        await client.channel.sendSuccess(
            message.channel,
            `${past} <@${user.id}> ${preposition} **${expanded}**!`
        )
    }
})
