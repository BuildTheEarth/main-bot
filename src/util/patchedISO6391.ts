import ISO6391 from "iso-639-1"

// this is an extension of ISO 369-1 which adds "zh-s" and "zh-t" (requested by the Translation Team)
// data.js isn't accessible (because it's an ES module or whatever), so we'll have to patch
// on top of the original methods (instead of copying them directly).

// also, all of this is kind of intrinsically a mess, so TODO: find a better way to do... this
export default class PatchedISO6391 {
    static getLanguages(codes = []): IndependentLanguageData[] {
        return codes.map(code => ({
            code,
            name: this.getName(code),
            nativeName: this.getNativeName(code)
        }))
    }

    static getName(code: string): string {
        if (removed.includes(code)) return ""
        return ISO6391.getName(code) || extra[code]?.name || ""
    }

    static getAllNames(): string[] {
        return ISO6391.getAllNames().concat(Object.values(extra).map(lang => lang.name))
    }

    static getNativeName(code: string): string {
        return ISO6391.getName(code) || extra[code]?.nativeName || ""
    }

    static getAllNativeNames(): string[] {
        const extraNativeNames = Object.values(extra).map(lang => lang.nativeName)
        return ISO6391.getAllNativeNames().concat(extraNativeNames)
    }

    static getCode(name: string): string {
        const base = ISO6391.getCode(name)
        const extended = Object.keys(extra).find(
            code =>
                extra[code].name.toLowerCase() === name.toLowerCase() ||
                extra[code].nativeName.toLowerCase() === name.toLowerCase()
        )

        if (removed.includes(base || extended)) return ""
        return base || extended || ""
    }

    static getAllCodes(): string[] {
        return ISO6391.getAllCodes().concat(Object.keys(extra))
    }

    static validate(code: string): boolean {
        if (removed.includes(code)) return false
        return ISO6391.validate(code) || !!extra[code]
    }
}

export interface LanguageData {
    name: string
    nativeName: string
}

export interface IndependentLanguageData extends LanguageData {
    code: string
}

const extra = {
    "zh-s": {
        name: "Simplified Chinese",
        nativeName: "简体中文"
    },
    "zh-t": {
        name: "Traditional Chinese",
        nativeName: "繁體中文"
    }
}

const removed = ["zh"]
