import Discord from "discord.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Roles from "./roles.util.js"
import Client from "../struct/Client.js"
export default async function toggleDutyRole(
    user: Discord.GuildMember,
    roles: ("SUPPORT" | "MODERATOR")[],
    client: Client
): Promise<boolean> {
    return await GuildMember.toggleRole(
        user,
        roles.map(role => Roles[role + "_ON_DUTY"]),
        "User went on/off duty.",
        client
    )
}