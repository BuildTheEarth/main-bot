import ConfigSubmodule from "./ConfigSubmodule"
import fs from "fs"
import JSON5 from "json5"

export default class MessagesConfig extends ConfigSubmodule {
    json: Record<string, string[]>

    async load(): Promise<void> {
        this.json = await JSON5.parse(
            await fs.promises.readFile("./config/extensions/messages.json5", "utf8")
        )
    }

    unload(): void {
        this.json = {}
    }
}
