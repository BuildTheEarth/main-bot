// Literally all of this code is taken from https://github.com/cAttte/fanum so thank him
import pluralize from "pluralize"
import duplicateChars from "../../data/duplicateChars"
import Client from "../Client"

export default class BannedWordFilter {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    findBannedWord(text: string): BannedWordObj[] {
        let profanities = []
        for (const word of Object.keys(this.client.filterWordsCached.banned)) {
            if (word.length > text.length) continue
            if (pluralize.isSingular(word)) {
                const plural = pluralize(word)
                const pluralMatches = this.findWord.bind(this)(text, plural, word)
                profanities = profanities.concat(pluralMatches)
            }
            const matches = this.findWord.bind(this)(text, word)
            profanities = profanities.concat(matches)
        }
        const indices = []
        profanities = profanities.filter((match, i) => {
            let passes = !indices.includes(profanities[i].index)
            indices.push(profanities[i].index)

            const exceptions = this.client.filterWordsCached.except.filter(ele =>
                ele.includes(match.word)
            )
            if (exceptions) {
                const wordExceptions = exceptions.filter(e => typeof e === "string")
                const isException = this.findException(match, text, wordExceptions)
                passes = passes && !isException
            }
            return passes
        })

        return profanities
    }

    findWord(text: string, word: string, base?: string): BannedWordObj[] {
        const profanities = []
        const regexBody = this.createWordRegex(word, 25)
        const regex = new RegExp(regexBody, "g")
        let match: RegExpExecArray

        while ((match = regex.exec(text)) != null) {
            profanities.push({
                index: match.index,
                word: word,
                base: base || word,
                raw: match[0]
            })
        }
        return profanities
    }

    findException(match: BannedWordObj, input: string, exceptions: string[]): boolean {
        const before = input.slice(0, match.index)
        const after = input.slice(match.index + match.raw.length)
        let isException = false

        for (const exception of exceptions) {
            const exceptionIndex = exception.indexOf(match.base)
            if (exceptionIndex === -1) continue
            const exceptionBefore = exception.slice(0, exceptionIndex)
            const exceptionAfter = exception.slice(exceptionIndex + match.base.length)
            const exceptionBeforeRegex = new RegExp(
                this.createWordRegex(exceptionBefore) + "$"
            )
            const exceptionAfterRegex = new RegExp(
                "^" + this.createWordRegex(exceptionAfter)
            )
            if (before.match(exceptionBeforeRegex) && after.match(exceptionAfterRegex)) {
                isException = true
                break
            }
        }

        return isException
    }

    createWordRegex(word: string, max: number = Infinity): string {
        const separator =
            this.createChooseRegex(duplicateChars.IRRELEVANT) +
            (max === Infinity ? "*" : `{0,${max}}`)
        const regexBody = word
            .split("")
            .map(letter => {
                const characters = duplicateChars[letter.toLowerCase()] || [letter]
                return this.createChooseRegex(characters)
            })
            .join(separator)
        return regexBody
    }

    createChooseRegex(strings: string[]): string {
        return "(" + strings.map(this.escapeRegex).join("|") + ")"
    }

    escapeRegex(string: string): string {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
    }
}

/**
 * @typedef BannedWordObj
 * @property {number} index The index in the input string of the word.
 * @property {string} word The word found. For example, `"lols"`.
 * @property {string} base The "base" word, unmodified, from the word list. For example, `"lol"`.
 * @property {string} raw The actual input as found inside the string. For example, `"l.ol`.
 */
export type BannedWordObj = {
    index?: number
    word?: string
    base?: string
    raw?: string
}
