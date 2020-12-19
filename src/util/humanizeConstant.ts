export default function humanizeConstant(
    name: string,
    knownAcronyms: string[] = []
): string {
    return name
        .split("_")
        .map(word =>
            knownAcronyms.includes(word)
                ? word
                : word[0].toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("")
}
