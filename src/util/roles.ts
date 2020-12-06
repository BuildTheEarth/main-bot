const knownAcronyms = ["PR", "BOTW", "DJ"]

function get(_target: any, key: string): string {
    const words = key.split("_")
    const capital = words.map(word =>
        knownAcronyms.includes(word)
            ? word
            : word[0].toUpperCase() + word.slice(1).toLowerCase()
    )
    return capital.join(" ")
}

export default <{ [key: string]: string }>new Proxy({}, { get })
