import Discord, {
    FetchMemberOptions,
    FetchMembersOptions,
    UserResolvable,
    Collection,
    Snowflake
} from "discord.js"

//Private constructor be like
//@ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        options: any
    ): Promise<Discord.GuildMember | Collection<Snowflake, Discord.GuildMember>> {
        return <
            Promise<Discord.GuildMember | Collection<Snowflake, Discord.GuildMember>>
        >super.fetch(options)
    }
}
