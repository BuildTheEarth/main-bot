import { hexToRGB } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import toggleDutyRole from "../../util/toggleDutyRole.util.js"
import Client from "../Client.js"

export default class DutyScheduler {
    dutyScheduler: Map<Discord.Snowflake, [NodeJS.Timeout, Date]>
    client: Client
    public constructor(client: Client) {
        this.dutyScheduler = new Map<Discord.Snowflake, [NodeJS.Timeout, Date]>()
        this.client = client
    }

    public async scheduleDuty(
        time: number,
        user: Discord.GuildMember,
        roles: ("SUPPORT" | "MODERATOR" | "HELPER")[]
    ): Promise<void> {
        if (roles.includes("HELPER")) {
            roles.pop()
            roles.push("MODERATOR")
        }
        this.dutyScheduler[user.id] = [
            setTimeout(async () => {
                const dutyToggle = await toggleDutyRole(user, roles, this.client)
                await user.send({
                    embeds: [
                        {
                            description: `You have been ${
                                dutyToggle ? "set on" : "removed from"
                            } duty.`,
                            color: hexToRGB(this.client.config.colors.error)
                        }
                    ]
                })
                delete this.dutyScheduler[user.id]
            }, time),
            new Date(Date.now() + time)
        ]
    }

    public async cancelWithCheck(
        user: Discord.GuildMember,
        userWhoDid: Discord.GuildMember
    ): Promise<boolean> {
        if (this.dutyScheduler[user.id] !== undefined) {
            clearTimeout(this.dutyScheduler[user.id][0])
            delete this.dutyScheduler[user.id]
            if (user.id !== userWhoDid.id)
                await user.send({
                    embeds: [
                        {
                            description: `Your duty schedule has been cancelled by <@${userWhoDid.id}>.`,
                            color: hexToRGB(this.client.config.colors.error)
                        }
                    ]
                })
            return true
        } else {
            return false
        }
    }

    public checkDuty(user: Discord.GuildMember): Promise<Date> {
        if (this.dutyScheduler[user.id] !== undefined) {
            const date = this.dutyScheduler[user.id][1]
            return date
        } else {
            return null
        }
    }
}
