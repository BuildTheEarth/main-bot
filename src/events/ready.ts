import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"

export default async function ready(this: Client) {
    const main = this.guilds.cache.get(this.config.guilds.main)
    this.user.setActivity(`with ${main.memberCount}`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) punishment.schedule(this)

    for (const channelID of Object.keys(this.config.reactionRoles)) {
        const channel = (await this.channels.fetch(channelID, true)) as TextChannel
        for (const messageID of Object.keys(this.config.reactionRoles[channelID])) {
            await channel.messages.fetch(messageID)
        }
    }
}
