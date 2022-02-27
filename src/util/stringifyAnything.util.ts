import JSON5 from "json5"

export default function stringifyAnything(
    thing: unknown,
    indent: number = 0,
    depth: number = 0,
    currentDepth: number = 0
): string {
    if (typeof thing === "string" && thing.includes("\n"))
        return `\`${thing.replace(/`/g, "\\`")}\``
    if (typeof thing === "function" || typeof thing === "symbol") return String(thing)
    if (typeof thing !== "object" || thing == null) return String(JSON5.stringify(thing))

    const omit = currentDepth > depth
    const space = " ".repeat(indent)
    const level = space + " ".repeat(4)

    if (!thing.constructor) {
        return "{}"
    } else if (thing.constructor.name === "Object") {
        const propertyNames = Object.getOwnPropertyNames(thing)
        if (!propertyNames.length) return "{}"

        const properties = omit
            ? " ... "
            : `\n${level}` +
              propertyNames
                  .map(name => {
                      const value = thing[name]
                      return `"${name}": ${stringifyAnything(
                          value,
                          indent + 4,
                          depth,
                          currentDepth + 1
                      )}`
                  })
                  .join(",\n" + level) +
              `\n${space}`

        return `{${properties}}`
    } else if (thing instanceof Array && thing.constructor.name === "Array") {
        if (!thing.length) return "[]"
        const items = omit
            ? " ... "
            : "\n" +
              thing
                  .map(
                      thing =>
                          level +
                          stringifyAnything(thing, indent + 4, depth, currentDepth + 1)
                  )
                  .join(",\n") +
              `\n${space}`

        return `[${items}]`
    } else {
        const propertyNames = Object.getOwnPropertyNames(thing)
        if (!propertyNames.length) return `${thing.constructor.name} {}`

        const properties = omit
            ? " ... "
            : "\n" +
              propertyNames
                  .map(name => {
                      const value = thing[name]
                      if (value === undefined) return null
                      return `${level}${name} = ${stringifyAnything(
                          value,
                          indent + 4,
                          depth,
                          currentDepth + 1
                      )}`
                  })
                  .filter(thing => thing !== null && typeof thing !== "function")
                  .join("\n") +
              "\n"

        return `${thing.constructor.name} {${properties}}`
    }
}
