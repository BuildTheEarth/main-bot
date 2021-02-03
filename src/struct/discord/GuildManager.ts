import Discord from "discord.js"
import Client from "../Client"
import Guild from "./Guild"

export default class GuildManager extends Discord.GuildManager {
    client: Client
    cache: Discord.Collection<string, Guild>

    get main(): Guild {
        return this.cache.get(this.client.config.guilds.main)
    }

    get staff(): Guild {
        return this.cache.get(this.client.config.guilds.staff)
    }

    get youtube(): Guild {
        return this.cache.get(this.client.config.guilds.youtube)
    }
}
