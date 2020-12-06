import ms from "ms"

export default function formatPunishmentTime(
    length: number,
    bare: boolean = false
): string {
    if (bare) {
        if (length === 0) return "**Permanent**"
        else return ms(length, { long: true })
    } else {
        if (length === 0) return "**permanently**"
        else return `for ${ms(length, { long: true })}`
    }
}
