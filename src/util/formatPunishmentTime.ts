import ms from "../util/ms"

export default function formatPunishmentTime(
    length: number,
    bare: boolean = false
): string {
    if (bare) {
        if (!length) return "**Permanent**"
        else return ms(length, { long: true })
    } else {
        if (!length) return "**permanently**"
        else return `for ${ms(length, { long: true })}`
    }
}
