import ConfigSubmodule from "./ConfigSubmodule.js"
import fs from "fs"
import { loadJSON5 } from "@buildtheearth/bot-utils"
import BotClient from "../BotClient.js"

export default class MessagesConfig implements ConfigSubmodule {
    client: BotClient
    json: Record<string, Record<string, string[]>> = { en: {} }

    constructor(client: BotClient) {
        this.client = client
    }

    async load(): Promise<void> {
        for await (const file of fs.readdirSync("./config/extensions/messages/")) {
            this.json[file.replace(".json5", "").replace("messages_", "")] =
                await loadJSON5("./config/extensions/messages/" + file)
        }
    }

    unload(): void {
        this.json = { en: {} }
    }
}
