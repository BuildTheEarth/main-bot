import { Guild } from "discord.js"
import BotClient from "../BotClient.js"

export default class GuildManager {
    client: BotClient

    constructor(client: BotClient) {
        this.client = client
    }

    main(): Guild {
        const returnValue = this.client.guilds.cache.get(this.client.config.guilds.main)
        if (!returnValue) throw new Error("main guild not found")
        return returnValue
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }

    staff(): Guild {
        const returnValue = this.client.guilds.cache.get(this.client.config.guilds.staff)
        if (!returnValue) throw new Error("staff guild not found")
        return returnValue
        //this is called with async just so i dont need to go renaming stuff everywhere when I may need to change it in the future:tm:
    }
}
