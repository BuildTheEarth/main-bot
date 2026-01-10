import { noop } from "@buildtheearth/bot-utils"
import { Guild, GuildMember, Role, UserResolvable } from "discord.js"

export default class BotGuild {
    static async member(
        guild: Guild,
        user: UserResolvable
    ): Promise<GuildMember> {
        return (await guild.members.fetch(user)) as GuildMember
    }

    static role(guild: Guild, name: string[]): Role {
        return (
            guild?.roles?.cache?.find(role => name.includes(role.id)) ||
            guild.roles.highest
        )
    }

    static roleByName(guild: Guild, name: string): Role {
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
