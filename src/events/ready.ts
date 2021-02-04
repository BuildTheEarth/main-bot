import chalk from "chalk"
import BannerImage from "../entities/BannerImage"
import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"
import noop from "../util/noop"

export default async function ready(this: Client): Promise<void> {
    const activity = `with ${this.guilds.main.memberCount} users`
    await this.user.setActivity(activity, { type: "PLAYING" }).catch(noop)

    // schedule punishment undoings and banner queue cycles
    BannerImage.schedule(this)
    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) punishment.schedule(this)

    // cache reaction role messages
    for (const channelID of Object.keys(this.config.reactionRoles)) {
        const channel: TextChannel = await this.channels
            .fetch(channelID)
            .catch(() => null)
        if (channel) {
            for (const messageID of Object.keys(this.config.reactionRoles[channelID])) {
                await channel.messages.fetch(messageID).catch(() => null)
            }
        }
    }

    if (this.guilds.main.features.includes("VANITY_URL")) {
        const current = await this.guilds.main.fetchVanityData()
        const outdated = current?.code !== this.config.vanity
        if (outdated) {
            const reason = "Reached level 3 boosting"
            await this.guilds.main.setVanityCode(this.config.vanity, reason)

            const pink = chalk.hex("#FF73FA")
            this.logger.info(`Set vanity code to ${pink(this.config.vanity)}.`)
        }
    }
}
