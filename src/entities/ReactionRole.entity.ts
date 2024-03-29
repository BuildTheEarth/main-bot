import { noop } from "@buildtheearth/bot-utils"
import { GuildMember } from "discord.js"
import typeorm from "typeorm"
import Client from "../struct/Client.js"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"

@typeorm.Entity({ name: "reaction_roles" })
export default class ReactionRole extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ type: "nvarchar", length: "20" })
    emoji!: string

    @SnowflakeColumn({ name: "channel_id" })
    channelId!: string

    @SnowflakeColumn({ name: "message_id" })
    messageId!: string

    @SnowflakeColumn({ name: "role_id" })
    roleId!: string

    @typeorm.Column({ name: "required_roles", nullable: true, type: "simple-array" })
    requiredRoles?: string[] | null

    @typeorm.Column({ default: true })
    requireType!: boolean

    @typeorm.Column({ name: "blacklisted_roles", nullable: true, type: "simple-array" })
    blackListedRoles?: string[] | null

    @typeorm.Column({ default: true })
    blacklistType!: boolean

    public static async load(client: Client): Promise<Map<string, ReactionRole>> {
        const reactionRoles = await this.find()
        for (const role of reactionRoles) {
            client.reactionRoles.set(`${role.emoji}.${role.messageId}`, role)
        }
        return client.reactionRoles
    }

    public static async getChannel(channelId: string): Promise<ReactionRole[]> {
        return ReactionRole.find({ channelId: channelId })
    }

    public contingent(): boolean {
        return this.requiredRoles || this.blackListedRoles ? true : false
    }

    public static async add(
        client: Client,
        emoji: string,
        channelId: string,
        messageId: string,
        roleId: string,
        requiredRoles?: string[],
        blackListedRoles?: string[],
        requireType: boolean = true,
        blacklistType: boolean = true
    ): Promise<boolean> {
        const has = await this.findOne({ where: { emoji: emoji, messageId: messageId } })
        if (has?.emoji === emoji && has?.messageId === messageId) return false
        const rRole = new ReactionRole()
        rRole.emoji = emoji
        rRole.channelId = channelId
        rRole.roleId = roleId
        rRole.messageId = messageId
        rRole.requireType = requireType
        rRole.blacklistType = blacklistType
        if (requiredRoles) rRole.requiredRoles = requiredRoles
        if (blackListedRoles) rRole.blackListedRoles = blackListedRoles
        await rRole.save()
        client.reactionRoles.set(`${rRole.emoji}.${rRole.messageId}`, rRole)
        return true
    }

    public static async removeEmoji(emoji: string, messageId: string): Promise<boolean> {
        if (!ReactionRole.exists(emoji, messageId)) return false
        await ReactionRole.delete({ emoji: emoji, messageId: messageId }).catch(noop)
        client.reactionRoles.delete(`${emoji}.${messageId}`)
        return true
    }

    public static async exists(emoji: string, messageId: string): Promise<boolean> {
        const has = await this.findOne({ emoji: emoji, messageId: messageId })
        return has ? true : false
    }

    public static async addBlacklistedRole(
        client: Client,
        id: number,
        blacklistRole: string
    ): Promise<boolean> {
        const has = await this.findOne(id)
        if (!has) return false

        if (!has.blackListedRoles) has.blackListedRoles = [blacklistRole]
        else if (!has.blackListedRoles.includes(blacklistRole))
            has.blackListedRoles = [...has.blackListedRoles, blacklistRole]

        await has.save()

        client.reactionRoles.set(`${has.emoji}.${has.messageId}`, has)
        return true
    }

    public static async addRequiredRole(
        client: Client,
        id: number,
        requireRole: string
    ): Promise<boolean> {
        const has = await this.findOne(id)
        if (!has) return false

        if (!has.requiredRoles) has.requiredRoles = [requireRole]
        else if (!has.requiredRoles.includes(requireRole))
            has.requiredRoles = [...has.requiredRoles, requireRole]

        await has.save()

        client.reactionRoles.set(`${has.emoji}.${has.messageId}`, has)
        return true
    }

    public static async removeBlacklistedRole(
        client: Client,
        id: number,
        blacklistRole: string
    ): Promise<boolean> {
        const has = await this.findOne(id)
        if (!has) return false

        if (!has.blackListedRoles) return false
        else if (has.blackListedRoles.includes(blacklistRole))
            has.blackListedRoles = has.blackListedRoles.filter(
                ele => ele !== blacklistRole
            )
        else return false

        await has.save()

        client.reactionRoles.set(`${has.emoji}.${has.messageId}`, has)
        return true
    }

    public static async removeRequiredRole(
        client: Client,
        id: number,
        requireRole: string
    ): Promise<boolean> {
        const has = await this.findOne(id)
        if (!has) return false

        if (!has.requiredRoles) return false
        else if (has.requiredRoles.includes(requireRole))
            has.requiredRoles = has.requiredRoles.filter(ele => ele !== requireRole)
        else return false

        await has.save()

        client.reactionRoles.set(`${has.emoji}.${has.messageId}`, has)
        return true
    }

    public static async canReact(
        client: Client,
        emoji: string,
        channelId: string,
        messageId: string,
        guildMember: GuildMember
    ): Promise<boolean> {
        const react = client.reactionRoles.get(`${emoji}.${messageId}`)
        if (!react) return false
        const reqRoles = react?.requiredRoles
        const unreqRoles = react?.blackListedRoles

        let wFn: "every" | "some" = "some"

        let bFn: "every" | "some" = "some"

        if (!react.requireType) wFn = "every"
        if (!react.blacklistType) bFn = "every"

        if (unreqRoles && reqRoles && unreqRoles.length != 0 && reqRoles.length != 0)
            return (
                unreqRoles[bFn](e => !guildMember.roles.cache.has(e)) &&
                reqRoles[wFn](e => guildMember.roles.cache.has(e))
            )
        if (unreqRoles && unreqRoles.length != 0)
            return unreqRoles[bFn](e => !guildMember.roles.cache.has(e))
        if (reqRoles && reqRoles.length != 0)
            return reqRoles[wFn](e => guildMember.roles.cache.has(e))

        return true
    }

    public static async react(
        client: Client,
        emoji: string,
        channelId: string,
        messageId: string,
        guildMember: GuildMember
    ): Promise<boolean> {
        const react = client.reactionRoles.get(`${emoji}.${messageId}`)
        if (!react) return false
        const role = await guildMember.guild.roles.fetch(react?.roleId)
        if (!role) return false
        const canReact = await this.canReact(
            client,
            emoji,
            channelId,
            messageId,
            guildMember
        )
        if (!canReact) return false

        if (guildMember.roles.cache.has(role.id)) return true

        await guildMember.roles.add(role).catch(noop)

        return true
    }

    public static async unreact(
        client: Client,
        emoji: string,
        channelId: string,
        messageId: string,
        guildMember: GuildMember
    ): Promise<boolean> {
        const react = client.reactionRoles.get(`${emoji}.${messageId}`)
        if (!react) return false
        const role = await guildMember.guild.roles.fetch(react?.roleId)
        if (!role) return false

        if (!guildMember.roles.cache.has(role.id)) return false

        await guildMember.roles.remove(role).catch(noop)

        return true
    }
}
