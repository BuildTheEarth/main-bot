import Discord from "discord.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Client from "../struct/Client.js"
export default async function toggleDutyRole(
    user: Discord.GuildMember,
    roles: ("SUPPORT" | "MODERATOR" | "HELPER")[],
    client: Client
): Promise<boolean> {
    if (roles.includes("HELPER") && roles.includes("MODERATOR") == false) {
        roles.pop()
        roles.push("MODERATOR")
    } else if (roles.includes("HELPER") && roles.includes("MODERATOR")) {
        roles.pop()
    }
    return await GuildMember.toggleRole(
        user,
        roles.map(role => client.roles[role + "_ON_DUTY"]),
        "User went on/off duty.",
        client
    )
}
