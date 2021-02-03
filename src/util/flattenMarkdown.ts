import Client from "../struct/Client"
import Discord from "discord.js"

export default function flattenMarkdown(
    string: string,
    client: Client,
    guild: Discord.Guild = client.guilds.main
): string {
    return string.replace(
        /(^|[^\\])<(@|@!|@&|#)(\d{18})>/g,
        replacer.bind(null, client, guild)
    )
}

function replacer(
    client: Client,
    guild: Discord.Guild,
    _match: string,
    char: string,
    mode: "@" | "@!" | "@&" | "#",
    id: string
): string {
    let name: string
    let manager: Discord.UserManager | Discord.RoleManager | Discord.GuildChannelManager
    switch (mode) {
        case "@":
        case "@!":
            name = "user"
            manager = client.users
            break
        case "@&":
            name = "role"
            manager = guild.roles
            break
        case "#":
            name = "channel"
            manager = guild.channels
            break
    }

    const object = manager.cache.get(id)
    const token = mode === "#" ? "#" : "@"
    if (object) {
        const display = object instanceof Discord.User ? object.tag : object.name
        return `${char}${token}${display}`
    } else {
        return `${char}${token}deleted-${name}`
    }
}
