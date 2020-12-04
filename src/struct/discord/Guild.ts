import Discord from "discord.js"
import Client from "../Client"
import GuildMemberManager from "./GuildMemberManager"

export default class Guild extends Discord.Guild {
    client: Client
    members: GuildMemberManager = new GuildMemberManager(this)

    get muteRole() {
        this.members
        return this.roles.cache.find(role => role.name.toLowerCase() === "muted")
    }
}
