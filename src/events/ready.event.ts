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
import { noop } from "@buildtheearth/bot-utils"

export default async function ready(this: Client): Promise<void> {
    if (!this.user) return //never gonna happen, its on ready, discord.js needs some better type assertion

    this.logger.debug("Loading commands...")
    await this.customCommands.load()
    this.logger.info("Loaded commands.")

    this.logger.debug("Loading interaction handlers...")
    await this.componentHandlers.load()
    this.logger.info("Loaded interaction handlers.")

    const guildList = await this.guilds.fetch()

    for (const guild of guildList) {
        if (
            !(
                guild[1].id == this.config.guilds.main ||
                guild[1].id == this.config.guilds.staff
            )
        ) {
            const foundGuild = await this.guilds.fetch(guild[1].id).catch(noop)

            if (foundGuild) {
                foundGuild.leave()
            }
        }
    }

    const activity = `with ${(await this.customGuilds.main()).memberCount} users`
    this.user.setActivity(activity, { type: Discord.ActivityType.Playing })

    // schedule punishment undoings, banner queue cycles, the blunder tracker interval, and advanced builder removals!
    BannerImage.schedule(this)
    for (const punishment of await TimedPunishment.find()) punishment.schedule(this)
    for (const builder of await AdvancedBuilder.find()) builder.schedule(this)
    for (const reminder of await Reminder.find()) await reminder.schedule(this)
    new Cron("0 0 * * *", () => BlunderTracker.inc(this))
    TeamPointsUser.registerDailyReset()

    if (this.customGuilds.main().features.includes("VANITY_URL")) {
        const current = await this.customGuilds.main().fetchVanityData()

        const outdated = current?.code !== this.config.vanity

        if (outdated) {
            const reason = "Reached level 3 boosting"
            await Guild.setVanityCode()

            const pink = chalk.hex("#FF73FA")
            this.logger.info(`Set vanity code to ${pink(this.config.vanity)}.`)
        }
    }
    if (this.config.jenkinsEnv) {
        this.logger.info("Jenkins run successful")
        process.exit(0)
    }
}
