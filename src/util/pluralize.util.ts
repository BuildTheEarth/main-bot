//https://github.com/plurals/pluralize

/*
The MIT License (MIT)

Copyright (c) 2013 Blake Embrey (hello@blakeembrey.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const pluralRules: Array<[RegExp, string]> = []
const singularRules: Array<[RegExp, string]> = []
const uncountables = {}
const irregularPlurals = {}
const irregularSingles = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export function sanitizeRule(rule: RegExp | string): RegExp {
    if (typeof rule === "string") {
        return new RegExp("^" + rule + "$", "i")
    }

    return rule
}

export function restoreCase(word: string, token: string): string {
    // Tokens are an exact match.
    if (word === token) return token

    // Lower cased words. E.g. "hello".
    if (word === word.toLowerCase()) return token.toLowerCase()

    // Upper cased words. E.g. "WHISKY".
    if (word === word.toUpperCase()) return token.toUpperCase()

    // Title cased words. E.g. "Title".
    if (word[0] === word[0].toUpperCase()) {
        return token.charAt(0).toUpperCase() + token.substr(1).toLowerCase()
    }

    // Lower cased words. E.g. "test".
    return token.toLowerCase()
}

export function interpolate(str: string, args: Array<string>): string {
    return str.replace(/\$(\d{1,2})/g, function (match, index) {
        return args[index] || ""
    })
}

export function replace(
    word: string,
    rule: [RegExp, string],
    ...args: undefined[]
): string {
    return word.replace(rule[0], function (match, index) {
        const result = interpolate(rule[1], args)

        if (match === "") {
            return restoreCase(word[index - 1], result)
        }

        return restoreCase(match, result)
    })
}

export function sanitizeWord(
    token: string,
    word: string,
    rules: Array<[RegExp, string]>
): string {
    // Empty string or doesn't need fixing.
    if (!token.length || Object.prototype.hasOwnProperty.call(uncountables, token)) {
        return word
    }

    let len = rules.length

    // Iterate over the sanitization rules and use the first one to match.
    while (len--) {
        const rule = rules[len]

        if (rule[0].test(word)) return replace(word, rule)
    }

    return word
}

export function replaceWord(
    replaceMap: Record<string, string>,
    keepMap: Record<string, string>,
    rules: Array<[RegExp, string]>
): (word: string) => string {
    return function (word: string): string {
        // Get the correct token and case restoration functions.
        const token = word.toLowerCase()

        // Check against the keep object map.
        if (Object.prototype.hasOwnProperty.call(keepMap, token)) {
            return restoreCase(word, token)
        }

        // Check against the replacement map for a direct word replacement.
        if (Object.prototype.hasOwnProperty.call(replaceMap, token)) {
            return restoreCase(word, replaceMap[token])
        }

        // Run all the rules against the word.
        return sanitizeWord(token, word, rules)
    }
}

export function checkWord(
    replaceMap: Record<string, string>,
    keepMap: Record<string, string>,
    rules: Array<[RegExp, string]>
) {
    return function (word: string): boolean {
        const token = word.toLowerCase()

        if (Object.prototype.hasOwnProperty.call(keepMap, token)) return true
        if (Object.prototype.hasOwnProperty.call(replaceMap, token)) return false

        return sanitizeWord(token, token, rules) === token
    }
}

export default function pluralize(
    word: string,
    count?: number,
    inclusive?: boolean
): string {
    const pluralized = count === 1 ? singular(word) : plural(word)

    return (inclusive ? count + " " : "") + pluralized
}

export const plural: (word: string) => string = replaceWord(
    irregularSingles,
    irregularPlurals,
    pluralRules
)

export const isPlural: (word: string) => boolean = checkWord(
    irregularSingles,
    irregularPlurals,
    pluralRules
)

export const singular: (word: string) => string = replaceWord(
    irregularPlurals,
    irregularSingles,
    singularRules
)

export const isSingular: (word: string) => boolean = checkWord(
    irregularPlurals,
    irregularSingles,
    singularRules
)

export function addPluralRule(rule: string | RegExp, replacement: string): number {
    return pluralRules.push([sanitizeRule(rule), replacement])
}

export function addSingularRule(rule: string | RegExp, replacement: string): number {
    return singularRules.push([sanitizeRule(rule), replacement])
}

export function addUncountableRule(word: string | RegExp): void {
    if (typeof word === "string") {
        uncountables[word.toLowerCase()] = true
        return
    }

    // Set singular and plural references for the word.
    addPluralRule(word, "$0")
    addSingularRule(word, "$0")
}

export function addIrregularRule(single: string, plural: string): void {
    plural = plural.toLowerCase()
    single = single.toLowerCase()

    irregularSingles[single] = plural
    irregularPlurals[plural] = single
}

/**
 * Irregular rules.
 */
;[
    // Pronouns.
    ["I", "we"],
    ["me", "us"],
    ["he", "they"],
    ["she", "they"],
    ["them", "them"],
    ["myself", "ourselves"],
    ["yourself", "yourselves"],
    ["itself", "themselves"],
    ["herself", "themselves"],
    ["himself", "themselves"],
    ["themself", "themselves"],
    ["is", "are"],
    ["was", "were"],
    ["has", "have"],
    ["this", "these"],
    ["that", "those"],
    ["my", "our"],
    ["its", "their"],
    ["his", "their"],
    ["her", "their"],
    // Words ending in with a consonant and `o`.
    ["echo", "echoes"],
    ["dingo", "dingoes"],
    ["volcano", "volcanoes"],
    ["tornado", "tornadoes"],
    ["torpedo", "torpedoes"],
    // Ends with `us`.
    ["genus", "genera"],
    ["viscus", "viscera"],
    // Ends with `ma`.
    ["stigma", "stigmata"],
    ["stoma", "stomata"],
    ["dogma", "dogmata"],
    ["lemma", "lemmata"],
    ["schema", "schemata"],
    ["anathema", "anathemata"],
    // Other irregular rules.
    ["ox", "oxen"],
    ["axe", "axes"],
    ["die", "dice"],
    ["yes", "yeses"],
    ["foot", "feet"],
    ["eave", "eaves"],
    ["goose", "geese"],
    ["tooth", "teeth"],
    ["quiz", "quizzes"],
    ["human", "humans"],
    ["proof", "proofs"],
    ["carve", "carves"],
    ["valve", "valves"],
    ["looey", "looies"],
    ["thief", "thieves"],
    ["groove", "grooves"],
    ["pickaxe", "pickaxes"],
    ["passerby", "passersby"],
    ["canvas", "canvases"]
].forEach(function (rule) {
    return addIrregularRule(rule[0], rule[1])
})

/**
 * Pluralization rules.
 */
;[
    [/s?$/i, "s"],
    // eslint-disable-next-line no-control-regex
    [/[^\u0000-\u007F]$/i, "$0"],
    [/([^aeiou]ese)$/i, "$1"],
    [/(ax|test)is$/i, "$1es"],
    [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, "$1es"],
    [/(e[mn]u)s?$/i, "$1s"],
    [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, "$1"],
    [
        /(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i,
        "$1i"
    ],
    [/(alumn|alg|vertebr)(?:a|ae)$/i, "$1ae"],
    [/(seraph|cherub)(?:im)?$/i, "$1im"],
    [/(her|at|gr)o$/i, "$1oes"],
    [
        /(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i,
        "$1a"
    ],
    [
        /(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i,
        "$1a"
    ],
    [/sis$/i, "ses"],
    [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, "$1$2ves"],
    [/([^aeiouy]|qu)y$/i, "$1ies"],
    [/([^ch][ieo][ln])ey$/i, "$1ies"],
    [/(x|ch|ss|sh|zz)$/i, "$1es"],
    [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, "$1ices"],
    [/\b((?:tit)?m|l)(?:ice|ouse)$/i, "$1ice"],
    [/(pe)(?:rson|ople)$/i, "$1ople"],
    [/(child)(?:ren)?$/i, "$1ren"],
    [/eaux$/i, "$0"],
    [/m[ae]n$/i, "men"],
    ["thou", "you"]
].forEach(function (rule) {
    return addPluralRule(rule[0], rule[1] as string)
})

/**
 * Singularization rules.
 */
;[
    [/s$/i, ""],
    [/(ss)$/i, "$1"],
    [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, "$1fe"],
    [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, "$1f"],
    [/ies$/i, "y"],
    [/(dg|ss|ois|lk|ok|wn|mb|th|ch|ec|oal|is|ck|ix|sser|ts|wb)ies$/i, "$1ie"],
    [
        /\b(l|(?:neck|cross|hog|aun)?t|coll|faer|food|gen|goon|group|hipp|junk|vegg|(?:pork)?p|charl|calor|cut)ies$/i,
        "$1ie"
    ],
    [/\b(mon|smil)ies$/i, "$1ey"],
    [/\b((?:tit)?m|l)ice$/i, "$1ouse"],
    [/(seraph|cherub)im$/i, "$1"],
    [
        /(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$/i,
        "$1"
    ],
    [/(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$/i, "$1sis"],
    [/(movie|twelve|abuse|e[mn]u)s$/i, "$1"],
    [/(test)(?:is|es)$/i, "$1is"],
    [
        /(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i,
        "$1us"
    ],
    [
        /(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i,
        "$1um"
    ],
    [
        /(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i,
        "$1on"
    ],
    [/(alumn|alg|vertebr)ae$/i, "$1a"],
    [/(cod|mur|sil|vert|ind)ices$/i, "$1ex"],
    [/(matr|append)ices$/i, "$1ix"],
    [/(pe)(rson|ople)$/i, "$1rson"],
    [/(child)ren$/i, "$1"],
    [/(eau)x?$/i, "$1"],
    [/men$/i, "man"]
].forEach(function (rule) {
    return addSingularRule(rule[0], rule[1] as string)
})

/**
 * Uncountable rules.
 */
;[
    // Singular words with no plurals.
    "adulthood",
    "advice",
    "agenda",
    "aid",
    "aircraft",
    "alcohol",
    "ammo",
    "analytics",
    "anime",
    "athletics",
    "audio",
    "bison",
    "blood",
    "bream",
    "buffalo",
    "butter",
    "carp",
    "cash",
    "chassis",
    "chess",
    "clothing",
    "cod",
    "commerce",
    "cooperation",
    "corps",
    "debris",
    "diabetes",
    "digestion",
    "elk",
    "energy",
    "equipment",
    "excretion",
    "expertise",
    "firmware",
    "flounder",
    "fun",
    "gallows",
    "garbage",
    "graffiti",
    "hardware",
    "headquarters",
    "health",
    "herpes",
    "highjinks",
    "homework",
    "housework",
    "information",
    "jeans",
    "justice",
    "kudos",
    "labour",
    "literature",
    "machinery",
    "mackerel",
    "mail",
    "media",
    "mews",
    "moose",
    "music",
    "mud",
    "manga",
    "news",
    "only",
    "personnel",
    "pike",
    "plankton",
    "pliers",
    "police",
    "pollution",
    "premises",
    "rain",
    "research",
    "rice",
    "salmon",
    "scissors",
    "series",
    "sewage",
    "shambles",
    "shrimp",
    "software",
    "staff",
    "swine",
    "tennis",
    "traffic",
    "transportation",
    "trout",
    "tuna",
    "wealth",
    "welfare",
    "whiting",
    "wildebeest",
    "wildlife",
    "you",
    /pok[eé]mon$/i,
    // Regexes.
    /[^aeiou]ese$/i, // "chinese", "japanese"
    /deer$/i, // "deer", "reindeer"
    /fish$/i, // "fish", "blowfish", "angelfish"
    /measles$/i,
    /o[iu]s$/i, // "carnivorous"
    /pox$/i, // "chickpox", "smallpox"
    /sheep$/i
].forEach(addUncountableRule)
