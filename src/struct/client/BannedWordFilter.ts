// Literally all of this code is taken from https://github.com/cAttte/fanum so thank him
import path from "path"
import url from "url"
import { loadSyncJSON5, isSingular, pluralize } from "@buildtheearth/bot-utils"
const duplicateChars = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../../config/extensions/duplicateChars.json5"
    )
)
import Client from "../Client.js"
import BannedWord from "../../entities/BannedWord.entity.js"

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

export default class BannedWordFilter {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    keepStarPluralize(word: string): string {
        let startStar = false
        let endStar = false

        if (word.startsWith("*")) {
            word = word.replace("*", "")
            startStar = true
        }

        if (word.endsWith("*")) {
            word = word.slice(0, word.length - 1)
            endStar = true
        }

        word = pluralize(word)

        if (startStar) word = "*" + word
        if (endStar) word += "*"

        return word
    }

    ignoreStarIsSingular(bannedWord: BannedWord): boolean {
        if (bannedWord.regex) return false

        let word = bannedWord.word

        if (word.startsWith("*")) word = word.replace("*", "")

        if (word.endsWith("*")) word = word.slice(0, word.length - 1)

        return isSingular(word)
    }

    findBannedWord(text: string): BannedWordObj[] {
        const zeroWRegex = new RegExp(this.createChooseRegex(duplicateChars.ZERO_W), "g")
        text = text.replaceAll(zeroWRegex, "")

        for (const letter of ALPHABET) {
            const characters = duplicateChars[letter.toLowerCase()] || [letter]
            const regexLetter = new RegExp(this.createChooseRegex(characters), "g")
            text = text.replaceAll(regexLetter, letter)
        }

        text = text.toLowerCase()

        let profanities: BannedWordObj[] = []
        for (const word of this.client.filterWordsCached.banned.keys()) {
            const realWord = this.client.filterWordsCached.banned.get(word)
            if (!realWord) continue
            if (word.length > text.length) continue
            if (this.ignoreStarIsSingular(realWord)) {
                const plural = this.keepStarPluralize(word)
                const pluralMatches = this.findWordString.bind(this)(text, plural, word)
                profanities = profanities.concat(pluralMatches)
            }
            const matches = this.findWord.bind(this)(text, realWord)
            profanities = profanities.concat(matches)
        }
        const indices: number[] = []
        profanities = profanities.filter((match, i) => {
            const currIdx = profanities[i].index
            if (currIdx === undefined) return false
            let passes = !indices.includes(currIdx)
            indices.push(currIdx)

            const exceptions = this.client.filterWordsCached.except
            if (exceptions) {
                const wordExceptions = exceptions.filter(e => typeof e === "string")
                const isException = this.findException(match, text, wordExceptions)
                passes = passes && !isException
            }
            return passes
        })

        return profanities
    }

    findWord(text: string, bannedWord: BannedWord, base?: string): BannedWordObj[] {
        const profanities = []
        const regexBody = this.createWordRegexObj(bannedWord, Infinity)
        const regex = new RegExp(regexBody, "g")
        let match: RegExpExecArray | null

        while ((match = regex.exec(text)) != null) {
            profanities.push({
                index: match.index,
                word: match[0] || bannedWord.word,
                base: base || bannedWord.word,
                raw: match[0],
                regex: bannedWord.regex
            })
        }

        return profanities
    }

    findWordString(text: string, word: string, base?: string): BannedWordObj[] {
        const profanities = []
        const regexBody = this.createWordRegex(word, Infinity)
        const regex = new RegExp(regexBody, "g")
        let match: RegExpExecArray | null

        while ((match = regex.exec(text)) != null) {
            profanities.push({
                index: match.index,
                word: match[0] || word,
                base: base || word,
                raw: match[0],
                regex: false
            })
        }

        return profanities
    }

    findException(match: BannedWordObj, input: string, exceptions: string[]): boolean {
        if (match.index === undefined) return false
        if (match.raw === undefined) return false
        if (match.base === undefined) return false

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

    createWordRegexObj(word: BannedWord, max: number = Infinity): string {
        if (word.regex) return word.word

        return this.createWordRegex(word.word)
    }

    createWordRegex(word: string, max: number = Infinity): string {
        let startStar = false
        let endStar = false

        if (word.startsWith("*")) {
            word = word.replace("*", "")
            startStar = true
        }

        if (word.endsWith("*")) {
            word = word.slice(0, word.length - 1)
            endStar = true
        }

        const separator =
            this.createChooseRegex(duplicateChars.IRRELEVANT) +
            (max === Infinity ? "*" : `{0,${max}}`)
        let regexBody = word
            .split("")
            .map(letter => {
                const characters = [letter.toLowerCase()]
                return this.createChooseRegex(characters)
            })
            .join(separator)

        if (!startStar) regexBody = "(?<=\\s|^)" + regexBody
        if (!endStar) regexBody += "(?=\\s|$)"

        return regexBody
    }

    createChooseRegex(strings: string[]): string {
        return (
            "(" +
            strings
                .map(this.escapeRegex)
                .filter(letter => letter !== "")
                .join("|") +
            ")"
        )
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
 * @property {boolean} link Is this a link based automod?
 */
export type BannedWordObj = {
    index?: number
    word?: string
    base?: string
    raw?: string
    link?: boolean
    regex?: boolean
}
