import Discord from "discord.js"
import Client from "../Client"

export default class GuildManager {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    main(): Discord.Guild {
        return this.client.guilds.cache.get(this.client.config.guilds.main)
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }

    staff(): Discord.Guild {
        return this.client.guilds.cache.get(this.client.config.guilds.staff)
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }
}
