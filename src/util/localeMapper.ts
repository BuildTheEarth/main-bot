const mappingsRaw: Record<string, string[]> = {
    "da": ["da"],
    "de": ["de"],
    "en": ["en-US", "en-GB"],
    "es": ["es-ES"],
    "fr": ["fr"],
    "hr": ["hr"],
    "it": ["it"],
    "lt": ["lt"],
    "hu": ["hu"],
    "nl": ["nl"],
    "no": ["no"],
    "pl": ["pl"],
    "pt": ["pt-BR"],
    "ro": ["ro"],
    "fi": ["fi"],
    "sv": ["sv-SE"],
    "vi": ["vi"],
    "tr": ["tr"],
    "cs": ["cs"],
    "el": ["el"],
    "bg": ["bg"],
    "ru": ["ru"],
    "uk": ["uk"],
    "hi": ["hi"],
    "th": ["th"],
    "zh-t": ["zh-TW"],
    "zh-s": ["zh-CN"],
    "ja": ["ja"],
    "ko": ["ko"]
}

export default function getLocaleMapping(locale: string): string[] | null {
    if (mappingsRaw[locale]) return mappingsRaw[locale]
    return null
}
