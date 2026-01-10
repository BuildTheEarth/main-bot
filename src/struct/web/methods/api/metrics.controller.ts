import { Controller, Get, Res } from "@nestjs/common"
import { Response } from "express"
import { Gauge, register } from "prom-client"
import BotClient from "../../../BotClient.js"

@Controller("/api/v1/metrics")
export default class MetricsController {
    private discordMembersGauge: any

    constructor() {
        // Initialize Prometheus gauge
        this.discordMembersGauge = new Gauge({
            name: "discord_members_total",
            help: "Total number of members in the Discord server",
            labelNames: ["guild_id", "guild_name"]
        })

        this.startUpdatingMembersCount(client)
    }

    // Function to update members count gauge
    private async updateMembersCount(client: BotClient) {
        try {
            for (const guild of [
                globalThis.client.customGuilds.main(),
                globalThis.client.customGuilds.staff()
            ]) {
                const memberCount = guild.memberCount
                this.discordMembersGauge.labels(guild.id, guild.name).set(memberCount)
            }
        } catch (error) {
            console.error("Error fetching guild information:", error)
        }
    }

    // Function to start updating members count periodically
    private startUpdatingMembersCount(client: BotClient) {
        setInterval(() => this.updateMembersCount(client), 5000)
    }

    @Get()
    async getMetrics(@Res() res: Response): Promise<void> {
        res.set("Content-Type", "text/plain")
        res.send(await register.metrics())
        console.log(await register.metrics())
    }
}
