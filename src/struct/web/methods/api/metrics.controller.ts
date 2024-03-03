import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { Client } from "discord.js";
import { Gauge, register } from "prom-client";

@Controller("/api/v1/metrics")
export default class MetricsController {
  private discordMembersGauge: any;

  constructor() {
    // Initialize Prometheus gauge
    this.discordMembersGauge = new Gauge({
      name: "discord_members_total",
      help: "Total number of members in the Discord server",
      labelNames: ["guild_id", "guild_name"]
    });

    this.startUpdatingMembersCount(client)
  }

  // Function to update members count gauge
  private async updateMembersCount(client: Client) {
    try {
      const guild = await client.guilds.fetch("690908396404080650");
      const memberCount = guild.memberCount;
      this.discordMembersGauge.labels(guild.id, guild.name).set(memberCount);
      console.log(
        `Updated member count for server ${guild.name} (${guild.id}): ${memberCount}`
      );
    } catch (error) {
      console.error("Error fetching guild information:", error);
    }
  }

  // Function to start updating members count periodically
  private startUpdatingMembersCount(client: Client) {
    setInterval(() => this.updateMembersCount(client), 5 * 60 * 1000);
  }

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set("Content-Type", register.contentType);
    res.send(register.metrics());
  }
}
