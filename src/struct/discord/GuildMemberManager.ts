import Discord, {
    FetchMemberOptions,
    FetchMembersOptions,
    UserResolvable,
    Collection,
    Snowflake
} from "discord.js"

export default class GuildMemberManager extends Discord.GuildMemberManager {
    fetch(
        options:
            | UserResolvable
            | FetchMemberOptions
            | (FetchMembersOptions & { user: UserResolvable })
    ): Promise<Discord.GuildMember>
    fetch(
        options?: FetchMembersOptions
    ): Promise<Collection<Snowflake, Discord.GuildMember>>
    fetch(
        options: unknown
    ): Promise<Discord.GuildMember | Collection<Snowflake, Discord.GuildMember>> {
        return <
            Promise<Discord.GuildMember | Collection<Snowflake, Discord.GuildMember>>
        >super.fetch(options)
    }
}
