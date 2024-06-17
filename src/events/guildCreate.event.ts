import Discord from "discord.js"
import Client from "../struct/Client.js"

export default async function guildCreate(
    this: Client,
    guild: Discord.Guild
): Promise<void> {
    if (!(guild.id == this.config.guilds.main || guild.id == this.config.guilds.staff)) {
        await guild.leave()
        return
    }
}
