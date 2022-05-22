import Discord from "discord.js"
import Client from "../Client.js"

export default class GuildManager {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    main(): Discord.Guild {
        const returnValue = this.client.guilds.cache.get(this.client.config.guilds.main)
        if (!returnValue) throw new Error("main guild not found")
        return returnValue
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }

    staff(): Discord.Guild {
        const returnValue = this.client.guilds.cache.get(this.client.config.guilds.staff)
        if (!returnValue) throw new Error("staff guild not found")
        return returnValue
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }
}
