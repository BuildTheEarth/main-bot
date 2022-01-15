import fs from "fs"
import JSON5 from "json5"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function loadJSON5(filename: string): Promise<any> {
    const content = await fs.promises.readFile(filename, "utf8")
    try {
        return await JSON5.parse(content)
    } catch (err) {
        err.message = filename + ": " + err.message
        throw err
    }
}

export function loadSyncJSON5(filename: string): any {
    const content = fs.readFileSync(filename, "utf8")
    try {
        return JSON5.parse(content)
    } catch (err) {
        err.message = filename + ": " + err.message
        throw err
    }
}
