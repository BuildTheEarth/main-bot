import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"
import noop from "../util/noop"

export default async function ready(this: Client) {
    const main = this.guilds.cache.get(this.config.guilds.main)
    this.user.setActivity(`with ${main.memberCount}`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) punishment.schedule(this)

    for (const channelID of Object.keys(this.config.reactionRoles)) {
        const channel = <TextChannel>await this.channels.fetch(channelID).catch(noop)
        for (const messageID of Object.keys(this.config.reactionRoles[channelID])) {
            await channel.messages.fetch(messageID).catch(noop)
        }
    }
}
