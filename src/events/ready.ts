import Client from "../struct/Client"
import TimedPunishment from "../entities/TimedPunishment"

export default async function (client: Client) {
    client.user.setActivity(`${client.config.prefix}help`, { type: "PLAYING" })

    const punishments = await TimedPunishment.find()
    for (const punishment of punishments) {
        if (punishment.end < Date.now()) {
            punishment.undo(client)
        } else {
            const offset = punishment.end - Date.now()
            setTimeout(async () => {
                await punishment.undo(client)
                await punishment.remove()
            }, offset)
        }
    }
}
