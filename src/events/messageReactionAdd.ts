import Discord from "discord.js"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"

export default async function messageReactionAdd(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
): Promise<void> {
    if (reaction.message?.guild?.id === this.config.guilds.youtube) return
    const channel = this.config.reactionRoles?.[reaction.message.channel.id]
    const role = channel?.[reaction.message.id]?.[reaction.emoji.name]
    const guild = reaction.message.guild
    if (guild) {
        const member: Discord.GuildMember = await guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (member && role) await member.roles.add(role).catch(noop)
        const channel = reaction.message.channel as Discord.TextChannel

        if (
            guild.id === this.config.guilds.staff &&
            channel.name === "weekly-updates" &&
            reaction.emoji.name === "📣" &&
            GuildMember.hasRole(member, Roles.MANAGER)
        ) {
            await reaction.users.remove(user)
            let update = reaction.message.content
            if (reaction.message.author.id !== this.user.id)
                update = `Weekly update from ${reaction.message.author}:\n\n` + update

            const updates = this.channels.cache.find(
                channel =>
                    // @ts-ignore
                    channel.name === "updates" &&
                    // @ts-ignore
                    channel.guild?.id === this.config.guilds.main
            ) as Discord.TextChannel

            await updates.send(update)
        }
    }
}
