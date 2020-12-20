// this inflector is *really* simple, but it works with the words used here
// and i'd rather not depend on a 12 MB package!
export default function pastTense(verb: string): string {
    if (isConsonant(last(verb)) && isVowel(last(verb, 1)) && isConsonant(last(verb, 2)))
        return verb + last(verb) + "ed"
    if (verb.endsWith("c")) return verb + "ked"
    if (verb.endsWith("e")) return verb + "d"
}

function last(word: string, count: number = 0): string {
    return word[word.length - count - 1]
}

function isConsonant(letter: string): boolean {
    return !isVowel(letter)
}

function isVowel(letter: string): boolean {
    return ["a", "e", "i", "o", "u"].includes(letter.toLowerCase())
}
