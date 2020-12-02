import TimedPunishment from "../entities/TimedPunishment"

export default async function ready() {
    this.user.setActivity(`${this.config.prefix}help`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) {
        if (punishment.end < Date.now()) {
            punishment.undo(this)
        } else {
            const offset = punishment.end - Date.now()
            setTimeout(async () => {
                await punishment.undo(this)
                await punishment.remove()
            }, offset)
        }
    }
}
