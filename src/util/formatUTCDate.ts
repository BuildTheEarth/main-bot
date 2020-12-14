import fecha from "fecha"

export default function formatUTCDate(date: Date): string {
    const utcOffset = date.getTimezoneOffset() * 60000
    const utc = new Date(date.getTime() + utcOffset)
    const formatted = fecha.format(utc, "DD/MM/YY [@] HH:mm:ss UTC")
    return formatted
}
