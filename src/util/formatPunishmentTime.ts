import ms from "ms"

export default function formatPunishmentTime(length: number): string {
    if (length === 0) return "**permanently**"
    else return `for ${ms(length, { long: true })}`
}
