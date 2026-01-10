import { MessageReaction, User, TextChannel } from "discord.js"
import BotClient from "../struct/BotClient.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import { noop } from "@buildtheearth/bot-utils"
import ReactionRole from "../entities/ReactionRole.entity.js"

export default async function messageReactionRemove(
    this: BotClient,
    reaction: MessageReaction,
    user: User
): Promise<void> {
    const guild = reaction.message.guild
    if (guild) {
        const member = await guild.members.fetch({ user, cache: true }).catch(noop)

        const channelRaw = reaction.message.channel

        const channel = reaction.message.channel as TextChannel

        const logChannel = (await this.channels.fetch(
            this.config.logging.modLogs
        )) as TextChannel

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
            BotGuildMember.hasRole(
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
                await reaction.message.unpin()
            } catch {
                return
            } finally {
                await this.response.sendError(
                    logChannel,
                    `<@${member.id}> unpinned message with id ${reaction.message.id} in suggestions thread <#${channelRaw.id}> (https://discord.com/channels/${this.config.guilds.main}/${channelRaw.id}/${reaction.message.id})`
                )
            }
        }

        let trueId = reaction.emoji.id

        if (!trueId) trueId = reaction.emoji.name

        if (!trueId) return
        if (!member) return

        const rolereactId = `${trueId}.${reaction.message.id}`

        if (this.reactionRoles.has(rolereactId)) {
            await ReactionRole.unreact(
                this,
                trueId,
                channel.id,
                reaction.message.id,
                member
            )
            return
        }
    }
}
