// @ts-nocheck
import {
    CachedManager,
    Snowflake,
    GuildMember,
    GuildMemberResolvable,
    Guild,
    UserResolvable,
    AddGuildMemberOptions,
    BanOptions,
    GuildMemberEditData,
    FetchMemberOptions,
    FetchMembersOptions,
    GuildListMembersOptions,
    Collection,
    User,
    GuildPruneMembersOptions,
    GuildSearchMembersOptions
} from "discord.js"

import { RawGuildMemberData } from "./rawDataTypes.js"

export class GuildMemberManagerFixed extends CachedManager<
    Snowflake,
    GuildMember,
    GuildMemberResolvable
> {
    public constructor(guild: Guild, iterable?: Iterable<RawGuildMemberData>)
    public guild: Guild
    public add(
        user: UserResolvable,
        options: AddGuildMemberOptions & { fetchWhenExisting: false }
    ): Promise<GuildMember | null>
    public add(user: UserResolvable, options: AddGuildMemberOptions): Promise<GuildMember>
    public ban(
        user: UserResolvable,
        options?: BanOptions
    ): Promise<GuildMember | User | Snowflake>
    public edit(
        user: UserResolvable,
        data: GuildMemberEditData,
        reason?: string
    ): Promise<void>
    public fetch(
        options:
            | UserResolvable
            | FetchMemberOptions
            | (FetchMembersOptions & { user: UserResolvable })
    ): Promise<GuildMember>
    public fetch(
        options?: FetchMembersOptions
    ): Promise<Collection<Snowflake, GuildMember>>
    public kick(
        user: UserResolvable,
        reason?: string
    ): Promise<GuildMember | User | Snowflake>
    public list(
        options?: GuildListMembersOptions
    ): Promise<Collection<Snowflake, GuildMember>>
    public prune(
        options: GuildPruneMembersOptions & { dry?: false; count: false }
    ): Promise<null>
    public prune(options?: GuildPruneMembersOptions): Promise<number>
    public search(
        options: GuildSearchMembersOptions
    ): Promise<Collection<Snowflake, GuildMember>>
    public unban(user: UserResolvable, reason?: string): Promise<User>
}
