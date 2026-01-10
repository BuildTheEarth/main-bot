import BotGuildMember from "../struct/discord/BotGuildMember.js"
import BotClient from "../struct/BotClient.js"
import { GuildMember } from "discord.js"
export default async function toggleDutyRole(
    user: GuildMember,
    roles: ("SUPPORT" | "MODERATOR" | "HELPER")[],
    client: BotClient
): Promise<boolean> {
    if (roles.includes("HELPER") && roles.includes("MODERATOR") == false) {
        roles.pop()
        roles.push("MODERATOR")
    } else if (roles.includes("HELPER") && roles.includes("MODERATOR")) {
        roles.pop()
    }
    return await BotGuildMember.toggleRole(
        user,
        roles.map(role => client.roles[role + "_ON_DUTY"]),
        "User went on/off duty.",
        client
    )
}
