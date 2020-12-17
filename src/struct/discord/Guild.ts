import Discord from "discord.js"
import Client from "../Client"
import GuildMember from "./GuildMember"

export default class Guild extends Discord.Guild {
    client: Client

    get muteRole(): Discord.Role {
        this.members
        return this.roles.cache.find(role => role.name.toLowerCase() === "muted")
    }
    
    get Role(rolename: string): Discord.Role {
        this.members
        return this.roles.cache.find(role => role.name.toLowerCase() === rolename.toLowerCase())
    }

    member(user: Discord.UserResolvable): GuildMember {
        return <GuildMember>super.member(user)
    }
}
