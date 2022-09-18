import { GuildMember } from "discord.js"
import typeorm from "typeorm"
import Client from "../struct/Client.js"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"

@typeorm.Entity({name: "reaction_roles"})
export default class ReactionRole extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({type: "nvarchar", length: "3"})
    emoji!: string

    @SnowflakeColumn({name: "channel_id"})
    channelId!: string

    @SnowflakeColumn({name: "message_id"})
    messageId!: string

    @typeorm.Column({name: "required_roles", nullable: true, type: "simple-array"})
    requiredRoles?: string[] | null

    @typeorm.Column({name: "blacklisted_roles", nullable: true, type: "simple-array"})
    blackListedRoles?: string[] | null

    public static async load(client: Client): Promise<Map<string, ReactionRole>> {
        const reactionRoles = await this.find()
        for (const role of reactionRoles) {
            client.reactionRoles.set(role.emoji, role)
        }
        return client.reactionRoles
    }

    public contingent(): boolean {
        return (this.requiredRoles || this.blackListedRoles)? true: false
    }

    public static async add(client: Client, emoji: string, channelId: string, messageId: string, requiredRoles?: string[], blackListedRoles?: string[]): Promise<boolean> {
        const has = await this.findOne({emoji: emoji})
        if (has) return false
        const rRole = new ReactionRole()
        rRole.emoji = emoji
        rRole.channelId = channelId
        rRole.messageId = messageId
        if (requiredRoles) rRole.requiredRoles = requiredRoles
        if (blackListedRoles) rRole.blackListedRoles = blackListedRoles
        await rRole.save()
        return true
    }

    public static async addBlacklistedRole(client: Client, emoji: string, blacklistRole: string): Promise<boolean> {
        const has = await this.findOne({emoji: emoji})
        if (!has) return false

        if (!has.blackListedRoles) has.blackListedRoles = [blacklistRole]
        else if (!has.blackListedRoles.includes(blacklistRole)) has.blackListedRoles = [...has.blackListedRoles, blacklistRole]

        await has.save()

        client.reactionRoles.set(has.emoji, has)
        return true
    }

    public static async addRequiredRole(client: Client, emoji: string, requireRole: string): Promise<boolean> {
        const has = await this.findOne({emoji: emoji})
        if (!has) return false

        if (!has.requiredRoles) has.requiredRoles = [requireRole]
        else if (!has.requiredRoles.includes(requireRole)) has.requiredRoles = [...has.requiredRoles, requireRole]

        await has.save()

        client.reactionRoles.set(has.emoji, has)
        return true
    }

    public static async removeBlacklistedRole(client: Client, emoji: string, blacklistRole: string): Promise<boolean> {
        const has = await this.findOne({emoji: emoji})
        if (!has) return false

        if (!has.blackListedRoles) return false
        else if (has.blackListedRoles.includes(blacklistRole)) has.blackListedRoles = has.blackListedRoles.filter((ele) => ele !== blacklistRole)
        else return false

        await has.save()

        client.reactionRoles.set(has.emoji, has)
        return true
    }

    
    public static async removeRequiredRole(client: Client, emoji: string, requireRole: string): Promise<boolean> {
        const has = await this.findOne({emoji: emoji})
        if (!has) return false

        if (!has.requiredRoles) return false
        else if (has.requiredRoles.includes(requireRole)) has.requiredRoles = has.requiredRoles.filter((ele) => ele !== requireRole)
        else return false

        await has.save()

        client.reactionRoles.set(has.emoji, has)
        return true
    }

    public static async canReact(client: Client, emoji: string, guildMember: GuildMember): Promise<boolean> {
        const react = await this.findOne({emoji: emoji})
        const reqRoles = react?.requiredRoles
        const unreqRoles = react?.blackListedRoles
        if (!react) return false

        if (unreqRoles && reqRoles) 
            return (!guildMember.roles.cache.every((e) => unreqRoles.includes(e.id))) && (guildMember.roles.cache.every((e) => reqRoles.includes(e.id)))
        if (unreqRoles) 
            return !guildMember.roles.cache.every((e) => unreqRoles.includes(e.id))     
        if (reqRoles) 
            return guildMember.roles.cache.every((e) => reqRoles.includes(e.id))
        


        return true
    }



}