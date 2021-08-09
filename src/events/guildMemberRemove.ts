import Client from "../struct/Client"
import noop from "../util/noop"
import Roles from "../util/roles"
import Guild from "../struct/discord/Guild"
import Discord from "discord.js"

export default async function guildMemberRemove(
    this: Client,
    member: Discord.GuildMember
): Promise<void> {
    if (member.guild.id === this.config.guilds.youtube) {
        const main = this.guilds.cache.get(this.config.guilds.main)
        const mainMember: Discord.GuildMember = await main.members
            .fetch({ user: member.user, cache: true })
            .catch(noop)
        if (!mainMember) return
        const mainRole = Guild.role(main, Roles.PIPPEN_YOUTUBE_GROUP)

        mainMember.roles.remove(mainRole).catch(noop)
    }
}
