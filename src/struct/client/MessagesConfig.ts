import ConfigSubmodule from "./ConfigSubmodule.js"

import { loadJSON5 } from "@buildtheearth/bot-utils"
import Client from "../Client.js"

export default class MessagesConfig implements ConfigSubmodule {
    client: Client
    json: Record<string, string[]>

    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        this.json = await loadJSON5("./config/extensions/messages.json5")
    }

    unload(): void {
        this.json = {}
    }
}
