import Discord from "discord.js"
import Client from "../struct/Client"
import noop from "../util/noop"

export default async function messageReactionAdd(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
) {
    const role = this.config.reactionRoles?.[reaction.message.id]?.[reaction.emoji.name]
    const guild = reaction.message.guild
    const member = guild.member(user)
    await member.roles.remove(role).catch(noop)
}
