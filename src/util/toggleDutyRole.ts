import Discord from "discord.js"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "./roles"
export default async function toggleDutyRole(
    user: Discord.GuildMember,
    roles: ("SUPPORT" | "MODERATOR")[]
): Promise<boolean> {
    return await GuildMember.toggleRole(
        user,
        roles.map(role => Roles[role + "_ON_DUTY"]),
        "User went on/off duty."
    )
}
