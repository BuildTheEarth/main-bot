import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"

export default async function ready(this: Client) {
    const main = this.guilds.cache.get(this.config.guilds.main)
    this.user.setActivity(`with ${main.memberCount}`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) punishment.schedule(this)
}
