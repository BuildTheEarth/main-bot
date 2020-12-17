import Discord, {
    FetchMemberOptions,
    FetchMembersOptions,
    UserResolvable,
    Collection,
    Snowflake
} from "discord.js"
import GuildMember from "./GuildMember"

export default class GuildMemberManager extends Discord.GuildMemberManager {
    fetch(
        options:
            | UserResolvable
            | FetchMemberOptions
            | (FetchMembersOptions & { user: UserResolvable })
    ): Promise<GuildMember>
    fetch(options?: FetchMembersOptions): Promise<Collection<Snowflake, GuildMember>>
    fetch(options: unknown): Promise<GuildMember | Collection<Snowflake, GuildMember>> {
        return <Promise<GuildMember | Collection<Snowflake, GuildMember>>>(
            super.fetch(options)
        )
    }
}
