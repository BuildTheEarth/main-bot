import Discord from "discord.js"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "./roles.util"
import Client from "../struct/Client"
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
