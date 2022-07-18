/***
 * Only accepts ms for number
 */
export function discordEpoch(num: Date | number): string {
    const newNum = new Date(num)

    return newNum.toISOString()
}
