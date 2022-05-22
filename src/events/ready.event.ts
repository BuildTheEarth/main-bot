import chalk = require("chalk")
import Discord from "discord.js"
import BannerImage from "../entities/BannerImage.entity.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import AdvancedBuilder from "../entities/AdvancedBuilder.entity.js"
import Client from "../struct/Client.js"
import Guild from "../struct/discord/Guild.js"
import Reminder from "../entities/Reminder.entity.js"
import BlunderTracker from "../entities/BlunderTracker.entity.js"
import { Cron } from "croner"
import TeamPointsUser from "../entities/TeamPointsUser.entity.js"

export default async function ready(this: Client): Promise<void> {

    if (!this.user) return //never gonna happen, its on ready, discord.js needs some better type assertion

    this.logger.debug("Loading commands...")
    await this.commands.load()
    this.logger.info("Loaded commands.")

    const activity = `with ${(await this.customGuilds.main()).memberCount} users`
    this.user.setActivity(activity, { type: "PLAYING" })

    // schedule punishment undoings, banner queue cycles, the blunder tracker interval, and advanced builder removals!
    BannerImage.schedule(this)
    for (const punishment of await TimedPunishment.find()) punishment.schedule(this)
    for (const builder of await AdvancedBuilder.find()) builder.schedule(this)
    for (const reminder of await Reminder.find()) await reminder.schedule(this)
    new Cron("0 0 * * *", () => BlunderTracker.inc(this))
    TeamPointsUser.registerDailyReset()

    // cache reaction role messages
    for (const channelID of Object.keys(this.config.reactionRoles)) {
        const channelTemp = await this.channels
            .fetch(channelID)
            .catch(() => null)
        let channel: Discord.TextChannel | null = null
        if (channelTemp instanceof Discord.TextChannel) channel = channelTemp
        if (channel) {
            for (const messageID of Object.keys(this.config.reactionRoles[channelID])) {
                await channel.messages.fetch(messageID).catch(() => null)
            }
        }
    }

    if (this.customGuilds.main().features.includes("VANITY_URL")) {
        const current = await (await this.customGuilds.main()).fetchVanityData()
        const outdated = current?.code !== this.config.vanity
        if (outdated) {
            const reason = "Reached level 3 boosting"
            await Guild.setVanityCode(
                await this.customGuilds.main(),
                this.config.vanity,
                reason
            )

            const pink = chalk.hex("#FF73FA")
            this.logger.info(`Set vanity code to ${pink(this.config.vanity)}.`)
        }
    }
    if (this.config.jenkinsEnv) {
        this.logger.info("Jenkins run successful")
        process.exit(0)
    }
}
