import LANGUAGES_LIST from "iso-639-1/src/data"

delete LANGUAGES_LIST.zh
Object.assign(LANGUAGES_LIST, {
    "zh-s": {
        name: "Simplified Chinese",
        nativeName: "简体中文"
    },
    "zh-t": {
        name: "Traditional Chinese",
        nativeName: "繁體中文"
    }
})

// this is an extension of ISO 369-1 which adds "zh-s" and "zh-t" (requested by the Translation Team)
// the code below is copied directly from the iso-639-1 module (with type declarations added).
export default class ISO6391 {
    static getLanguages(codes: string[] = []): IndependentLanguageData[] {
        return codes.map(code => ({
            code,
            name: ISO6391.getName(code),
            nativeName: ISO6391.getNativeName(code)
        }))
    }

    static getName(code: string): string {
        return ISO6391.validate(code) ? LANGUAGES_LIST[code].name : ""
    }

    static getAllNames(): LanguageData[] {
        // @ts-ignore
        return Object.values(LANGUAGES_LIST).map(l => l.name)
    }

    static getNativeName(code: string): string {
        return ISO6391.validate(code) ? LANGUAGES_LIST[code].nativeName : ""
    }

    static getAllNativeNames(): string[] {
        // @ts-ignore
        return Object.values(LANGUAGES_LIST).map(l => l.nativeName)
    }

    static getCode(name: string): string {
        const code = Object.keys(LANGUAGES_LIST).find(code => {
            const language = LANGUAGES_LIST[code]
            return (
                language.name.toLowerCase() === name.toLowerCase() ||
                language.nativeName.toLowerCase() === name.toLowerCase()
            )
        })
        return code || ""
    }

    static getAllCodes(): string[] {
        return Object.keys(LANGUAGES_LIST)
    }

    static validate(code: string): boolean {
        // eslint-disable-next-line no-prototype-builtins
        return LANGUAGES_LIST.hasOwnProperty(code)
    }
}

export interface LanguageData {
    name: string
    nativeName: string
}

export interface IndependentLanguageData extends LanguageData {
    code: string
}
