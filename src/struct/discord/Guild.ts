import { noop } from "@buildtheearth/bot-utils"
import Discord from "discord.js"

export default class Guild {
    static async member(
        guild: Discord.Guild,
        user: Discord.UserResolvable
    ): Promise<Discord.GuildMember> {
        return (await guild.members.fetch(user)) as Discord.GuildMember
    }

    static role(guild: Discord.Guild, name: string[]): Discord.Role {
        return (
            guild?.roles?.cache?.find(role => name.includes(role.id)) ||
            guild.roles.highest
        )
    }

    static roleByName(guild: Discord.Guild, name: string): Discord.Role {
        return (
            guild?.roles?.cache?.find(role => name === role.name) || guild.roles.highest
        )
    }

    static async setVanityCode(): Promise<void> {
        try {
            const chan = await client.customGuilds
                .staff()
                .channels.fetch("705931289861029949")
                .catch(noop)

            if (chan?.isTextBased()) {
                chan.send(
                    "<@&705137467719680052> Please reset the server vanity link to `buildtheearth`. Thank you for your time!"
                )
            }
        } catch {
            console.log("why")
        }
    }
}
