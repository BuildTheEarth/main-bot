import { hexToRGB } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import toggleDutyRole from "../../util/toggleDutyRole.util.js"
import Client from "../Client.js"
import { Cron } from "croner"

export default class DutyScheduler {
    dutyScheduler: Map<Discord.Snowflake, [Cron, Date]>
    client: Client
    public constructor(client: Client) {
        this.dutyScheduler = new Map<Discord.Snowflake, [Cron, Date]>()
        this.client = client
    }

    public async scheduleDuty(
        time: number,
        user: Discord.GuildMember,
        roles: ("SUPPORT" | "MODERATOR" | "HELPER")[]
    ): Promise<void> {
        if (roles.includes("HELPER") && roles.includes("MODERATOR") == false) {
            roles.pop()
            roles.push("MODERATOR")
        } else if (roles.includes("HELPER") && roles.includes("MODERATOR")) {
            roles.pop()
        }
        this.dutyScheduler.set(user.id, [
            new Cron(new Date(Date.now() + time), async () => {
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
                this.dutyScheduler.delete(user.id)
            }),
            new Date(Date.now() + time)
        ])
    }

    public async cancelWithCheck(
        user: Discord.GuildMember,
        userWhoDid: Discord.GuildMember
    ): Promise<boolean> {
        if (this.dutyScheduler.has(user.id)) {
            this.dutyScheduler.get(user.id)?.[0].stop()
            this.dutyScheduler.delete(user.id)
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

    public checkDuty(user: Discord.GuildMember): Date | null {
        if (this.dutyScheduler.has(user.id)) {
            const date = this.dutyScheduler.get(user.id)?.[1]
            return date ? date : null
        } else {
            return null
        }
    }
}
