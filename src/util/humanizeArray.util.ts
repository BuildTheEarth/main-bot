export default function humanizeArray(
    array: unknown[],
    code: boolean = true,
    conjunction: string = "or",
    comma: string = ", "
): string {
    array = array.map(String)
    if (code) array = array.map(value => `\`${value}\``)

    const lastJoiner = comma + conjunction + " "
    const last = array[array.length - 1]
    if (array.length === 1) return last as string
    return array.slice(0, array.length - 1).join(comma) + lastJoiner + last
}
