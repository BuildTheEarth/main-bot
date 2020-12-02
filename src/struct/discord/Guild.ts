import Discord from "discord.js"
import Client from "../Client"

export default class Guild extends Discord.Guild {
    client: Client

    get muteRole() {
        this.members
        return this.roles.cache.find(role => role.name.toLowerCase() === "muted")
    }
}
