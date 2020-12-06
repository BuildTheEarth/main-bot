import TimedPunishment from "../entities/TimedPunishment"
import Client from "../struct/Client"

export default async function ready(this: Client) {
    this.user.setActivity(`${this.config.prefix}help`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) {
        if (punishment.end <= new Date()) {
            punishment.undo(this)
        } else {
            punishment.schedule(this)
        }
    }
}
