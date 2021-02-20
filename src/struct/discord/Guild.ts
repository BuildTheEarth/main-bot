import Discord from "discord.js"
import Client from "../Client"
import GuildMember from "./GuildMember"
import GuildMemberManager from "./GuildMemberManager"

export default class Guild extends Discord.Guild {
    client: Client
    members: GuildMemberManager

    get muteRole(): Discord.Role {
        return this.roles.cache.find(role => role.name.toLowerCase() === "muted")
    }

    member(user: Discord.UserResolvable): GuildMember {
        return super.member(user) as GuildMember
    }

    async setVanityCode(code: string, reason?: string): Promise<void> {
        // @ts-ignore
        await this.client.api
            // @ts-ignore
            .guilds(this.id, "vanity-url")
            .patch({ data: { code }, reason })
    }
}
