import Discord from "discord.js"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"
import trimSides from "../util/trimSides"

export default async function messageReactionAdd(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
): Promise<void> {
    if (reaction.partial) await reaction.fetch().catch(noop)
    const channel = this.config.reactionRoles?.[reaction.message.channel.id]
    const role = channel?.[reaction.message.id]?.[reaction.emoji.name]
    const guild = reaction.message.guild
    if (guild) {
        const member: Discord.GuildMember = await guild.members
            .fetch({ user, cache: true })
            .catch(() => null)
        if (member && role) await member.roles.add(role).catch(noop)
        const channel = reaction.message.channel as Discord.TextChannel

        const channelRaw = reaction.message.channel

        const logChannel = (await this.channels.fetch(
            this.config.logging.modLogs
        )) as Discord.TextChannel

        if (
            guild.id === this.config.guilds.staff &&
            channel.name === "weekly-updates" &&
            reaction.emoji.name === "📣" &&
            GuildMember.hasRole(member, Roles.MANAGER, this)
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
            await this.response.sendSuccess(
                logChannel,
                `<@${member.id}> published message with id ${reaction.message.id} (https://discord.com/channels/${this.config.guilds.staff}/${channel.id}/${reaction.message.id})`
            )
        }

        if (
            guild.id === this.config.guilds.main &&
            channelRaw.isThread() &&
            channelRaw.parent.id === this.config.suggestions.main &&
            (reaction.emoji.identifier ===
                this.config.emojis.delete
                    .toString()
                    .replaceAll("<", "")
                    .replaceAll(">", "")) !=
                (reaction.emoji.name === this.config.emojis.delete) &&
            GuildMember.hasRole(
                member,
                [Roles.MODERATOR, Roles.MANAGER, Roles.HELPER, Roles.SUGGESTION_TEAM],
                this
            )
        ) {
            await reaction.message.delete()
            await this.response.sendError(
                logChannel,
                `<@${member.id}> deleted message with id ${reaction.message.id} in suggestions thread <#${channelRaw.id}> (https://discord.com/channels/${this.config.guilds.main}/${channelRaw.id}/${reaction.message.id})`
            )
        }

        const upvoteEmoji = this.emojis.cache.find(
            emoji =>
                emoji.identifier ===
                trimSides(this.config.emojis.upvote.toString(), "<:", ">")
        )

        const downvoteEmoji = this.emojis.cache.find(
            emoji =>
                emoji.identifier ===
                trimSides(this.config.emojis.downvote.toString(), "<:", ">")
        )

        // I hope this is at least slightly more readable than previously
        // I am embarrased that this code is not explainable without comments

        if (
            guild.id === this.config.guilds.main &&
            channelRaw.id === this.config.suggestions.main &&
            this.emojis.resolveId(reaction.emoji) !== "704728617997041675" // BTE Globe emoji in the main server (:BTEi:)
        ) {
            // checking if the name matches on upvote
            if (
                reaction.emoji.name !== this.config.emojis.upvote &&
                reaction.emoji.name !== this.config.emojis.downvote
            ) {
                // checking if the id matches
                if (
                    this.emojis.resolveId(reaction.emoji) !== downvoteEmoji.id &&
                    this.emojis.resolveId(reaction.emoji) !== upvoteEmoji.id
                ) {
                    await reaction.users.remove(user)
                }
            }
        }

        if (
            guild.id === this.config.guilds.main &&
            channelRaw.isThread() &&
            channelRaw.parent.id === this.config.suggestions.main &&
            (reaction.emoji.identifier ===
                this.config.emojis.pin
                    .toString()
                    .replaceAll("<", "")
                    .replaceAll(">", "")) !=
                (reaction.emoji.name === this.config.emojis.pin) &&
            GuildMember.hasRole(
                member,
                [Roles.MODERATOR, Roles.MANAGER, Roles.HELPER, Roles.SUGGESTION_TEAM],
                this
            )
        ) {
            try {
                await reaction.message.pin()
            } catch {
                return
            } finally {
                await this.response.sendSuccess(
                    logChannel,
                    `<@${member.id}> pinned message with id ${reaction.message.id} in suggestions thread <#${channelRaw.id}> (https://discord.com/channels/${this.config.guilds.main}/${channelRaw.id}/${reaction.message.id})`
                )
            }
        }
    }
}
