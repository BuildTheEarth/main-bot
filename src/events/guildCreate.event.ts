import { Guild } from "discord.js"
import BotClient from "../struct/BotClient.js"

export default async function guildCreate(
    this: BotClient,
    guild: Guild
): Promise<void> {
    if (!(guild.id == this.config.guilds.main || guild.id == this.config.guilds.staff)) {
        await guild.leave()
        return
    }
}
