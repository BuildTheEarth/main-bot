import Discord, { MembershipScreeningFieldType } from "discord.js"
import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import { noop, trimSides } from "@buildtheearth/bot-utils"
import ReactionRole from "../entities/ReactionRole.entity.js"
import { getTsBuildInfoEmitOutputFilePath } from "typescript"

export default async function messageReactionAdd(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
): Promise<void> {
    if (reaction.partial) await reaction.fetch().catch(noop)

    const guild = reaction.message.guild
    if (guild) {
        const member: Discord.GuildMember | null = await guild.members
            .fetch({ user, cache: true })
            .catch(() => null)

        if (reaction.emoji.name && member)
            ReactionRole.react(
                this,
                reaction.emoji.name,
                reaction.message.channel.id,
                reaction.message.id,
                member
            )

        const channel = reaction.message.channel as Discord.TextChannel

        const channelRaw = reaction.message.channel

        const logChannel = (await this.channels.fetch(
            this.config.logging.modLogs
        )) as Discord.TextChannel

        if (
            guild.id === this.config.guilds.staff &&
            channel.name === "weekly-updates" &&
            reaction.emoji.name === "📣" &&
            member &&
            GuildMember.hasRole(member, globalThis.client.roles.MANAGER, this)
        ) {
            await reaction.users.remove(user)
            let update = reaction.message.content
            if (reaction.message.author?.id !== this.user?.id)
                update = `Weekly update from ${reaction.message.author}:\n\n` + update

            const updates = this.channels.cache.find(
                channel =>
                    // @ts-ignore
                    channel.name === "updates" &&
                    // @ts-ignore
                    channel.guild?.id === this.config.guilds.main
            ) as Discord.TextChannel

            if (update) await updates.send(update)
            await this.response.sendSuccess(
                logChannel,
                `<@${member.id}> published message with id ${reaction.message.id} (https://discord.com/channels/${this.config.guilds.staff}/${channel.id}/${reaction.message.id})`
            )
        }

        if (
            guild.id === this.config.guilds.main &&
            channelRaw.isThread() &&
            channelRaw.parent?.id === this.config.suggestions.main &&
            (reaction.emoji.identifier ===
                this.config.emojis.delete
                    .toString()
                    .replaceAll("<", "")
                    .replaceAll(">", "")) !=
                (reaction.emoji.name === this.config.emojis.delete) &&
            member &&
            GuildMember.hasRole(
                member,
                [
                    globalThis.client.roles.MODERATOR,
                    globalThis.client.roles.MANAGER,
                    globalThis.client.roles.HELPER,
                    globalThis.client.roles.SUGGESTION_TEAM
                ],
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
                    this.emojis.resolveId(reaction.emoji) !== downvoteEmoji?.id &&
                    this.emojis.resolveId(reaction.emoji) !== upvoteEmoji?.id
                ) {
                    await reaction.users.remove(user)
                }
            }
        }

        if (
            guild.id === this.config.guilds.main &&
            channelRaw.isThread() &&
            channelRaw.parent?.id === this.config.suggestions.main &&
            (reaction.emoji.identifier ===
                this.config.emojis.pin
                    .toString()
                    .replaceAll("<", "")
                    .replaceAll(">", "")) !=
                (reaction.emoji.name === this.config.emojis.pin) &&
            member &&
            GuildMember.hasRole(
                member,
                [
                    globalThis.client.roles.MODERATOR,
                    globalThis.client.roles.MANAGER,
                    globalThis.client.roles.HELPER,
                    globalThis.client.roles.SUGGESTION_TEAM
                ],
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

        let trueId = reaction.emoji.id

        if (!trueId) trueId = reaction.emoji.name

        if (!trueId) return
        if (!member) return

        const rolereactId = `${trueId}.${reaction.message.id}`

        if (this.reactionRoles.has(rolereactId)) {
            if (await ReactionRole.canReact(this, trueId, channel.id, reaction.message.id, member)) {
                await ReactionRole.react(this, trueId, channel.id, reaction.message.id, member)
                return
            }
        }
    }
}
