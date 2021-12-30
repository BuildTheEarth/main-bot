import ConfigSubmodule from "./ConfigSubmodule"
import fs from "fs"

export default class MessagesConfig extends ConfigSubmodule {
    json: Record<string, string[]>

    async load(): Promise<void> {
        this.json = await JSON.parse(
            await fs.promises.readFile("./config/messages.json", "utf8")
        )
    }

    unload(): void {
        this.json = {}
    }
}
