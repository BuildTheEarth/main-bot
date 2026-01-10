import {
    FetchMemberOptions,
    FetchMembersOptions,
    UserResolvable,
    Collection,
    Snowflake,
    GuildMember,
    GuildMemberManager
} from "discord.js"

//Private constructor be like
//@ts-ignore
export default class BotGuildMemberManager extends GuildMemberManager {
    fetch(
        options:
            | UserResolvable
            | FetchMemberOptions
            | (FetchMembersOptions & { user: UserResolvable })
    ): Promise<GuildMember>
    fetch(
        options?: FetchMembersOptions
    ): Promise<Collection<Snowflake, GuildMember>>
    fetch(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        options: any
    ): Promise<GuildMember | Collection<Snowflake, GuildMember>> {
        return <
            Promise<GuildMember | Collection<Snowflake, GuildMember>>
        >super.fetch(options)
    }
}
