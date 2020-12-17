import Discord from "discord.js"
import Client from "../struct/Client"
import noop from "../util/noop"

export default async function messageReactionAdd(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
): Promise<void> {
    const channel = this.config.reactionRoles?.[reaction.message.channel.id]
    const role = channel?.[reaction.message.id]?.[reaction.emoji.name]
    const guild = reaction.message.guild
    const member = await guild.members.fetch({ user, cache: true })
    await member.roles.remove(role).catch(noop)
}
