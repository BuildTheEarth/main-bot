import typeorm from "typeorm"

export default <typeorm.ValueTransformer>{
    from: (value: string): string | null =>
        value === null
            ? null
            : /^<.+>$/.test(value)
            ? value
            : String.fromCodePoint(parseInt("0x" + value, 16)),
    to: (value: string): string | null => {
        const returnVal =
            value === null
                ? null
                : /^<.+>$/.test(value)
                ? value
                : value.codePointAt(0)?.toString(16)
        if (!returnVal) return null
        return returnVal
    }
}
