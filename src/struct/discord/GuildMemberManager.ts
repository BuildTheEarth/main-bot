import Discord from "discord.js"
import GuildMember from "./GuildMember"

export default class GuildMemberManager extends Discord.GuildMemberManager {
    async find(
        input: string
    ): Promise<{ input: string; args: string; member: GuildMember }> {
        const tag = input.match(/^.{2,32}#\d{4}/)?.[0]
        const id = input.match(/^(?:<@!?)?(\d{18})(?:>)?/)?.[1]
        if (!tag && !id) return { input: null, args: input, member: null }

        const member: GuildMember = id
            ? await this.fetch({ user: id, cache: true }).catch(() => undefined)
            : this.cache.find(m => m.user.tag === tag)

        if (id) input = input.split(" ").slice(1).join(" ").trim()
        else input = input.replace(tag, "").trim()

        return { input: tag || id, args: input, member }
    }
}
