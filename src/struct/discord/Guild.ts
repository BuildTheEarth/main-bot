import Discord from "discord.js"
import Client from "../Client"
import GuildMember from "./GuildMember"

export default class Guild extends Discord.Guild {
    client: Client

    get muteRole(): Discord.Role {
        return this.roles.cache.find(role => role.name.toLowerCase() === "muted")
    }

    member(user: Discord.UserResolvable): GuildMember {
        return <GuildMember>super.member(user)
    }
}
