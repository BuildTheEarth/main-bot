import Discord from "discord.js"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Guild from "../struct/discord/Guild"
import Roles from "../util/roles"
import noop from "../util/noop"

export default async function guildMemberUpdate(
    this: Client,
    oldMember: Discord.GuildMember,
    newMember: Discord.GuildMember
): Promise<void> {
    if (newMember.guild.id === this.config.guilds.youtube) {
        const mainMember: Discord.GuildMember = await this.customGuilds
            .main()
            .members.fetch({ user: newMember.user, cache: true })
            .catch(noop)
        if (!mainMember) return

        const mainRole = Guild.role(this.customGuilds.main(), Roles.PIPPEN_YOUTUBE_GROUP)
        const was = GuildMember.hasRole(oldMember, Roles.YOUTUBE)
        const is = GuildMember.hasRole(newMember, Roles.YOUTUBE)

        if (was && !is) mainMember.roles.remove(mainRole).catch(noop)
        else if (is && !was) mainMember.roles.add(mainRole).catch(noop)
    }
}
