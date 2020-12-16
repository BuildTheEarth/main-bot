export default function truncateString(
    string: string,
    length: number,
    ellipsis: string = "…"
): string {
    const exceeds = string.length > length
    const truncatedLength = exceeds ? length - ellipsis.length : length
    let truncated = string.slice(0, truncatedLength)
    if (exceeds) truncated += ellipsis
    return truncated
}
