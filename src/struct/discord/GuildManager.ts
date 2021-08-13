import Discord from "discord.js"
import Client from "../Client"

export default class GuildManager {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    main(): Discord.Guild {
        return this.client.guilds.cache.get(this.client.config.guilds.main)
    }

    staff(): Discord.Guild {
        return this.client.guilds.cache.get(this.client.config.guilds.staff)
    }

    youtube(): Discord.Guild {
        return this.client.guilds.cache.get(this.client.config.guilds.youtube)
    }
}
