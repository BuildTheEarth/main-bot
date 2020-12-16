import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"

export default async function ready(this: Client): Promise<void> {
    const main = this.guilds.cache.get(this.config.guilds.main)
    this.user.setActivity(`with ${main.memberCount} users`, { type: "PLAYING" })

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
}
