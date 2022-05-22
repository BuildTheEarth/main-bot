import Discord from "discord.js"
import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import { noop } from "@buildtheearth/bot-utils"

export default async function messageReactionRemove(
    this: Client,
    reaction: Discord.MessageReaction,
    user: Discord.User
): Promise<void> {
    const channel = this.config.reactionRoles?.[reaction.message.channel.id]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role: any = null
    if (reaction.emoji.name) channel?.[reaction.message.id]?.[reaction.emoji.name]
    const guild = reaction.message.guild
    if (guild) {
        const member = await guild.members.fetch({ user, cache: true }).catch(noop)
        if (member && role) await member.roles.remove(role).catch(noop)

        const channelRaw = reaction.message.channel

        const logChannel = (await this.channels.fetch(
            this.config.logging.modLogs
        )) as Discord.TextChannel

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
    }
}
