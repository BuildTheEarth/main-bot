import Client from "../Client.js"

export default class Messages {
    client: Client

    proxy: Record<string, string>

    constructor(client: Client) {
        this.client = client
        this.proxy = new Proxy(
            {},
            {
                get: (key: unknown, type: string): string => this.get(key, type, client)
            }
        ) as Record<string, string>
    }

    private get(key: unknown, type: string, client: Client): string {
        if (client.config.submodules.messages.json[type] === undefined)
            return "Message not set in configuration!"
        const arrayIndex = Math.floor(
            Math.random() * client.config.submodules.messages.json[type].length
        )
        return client.config.submodules.messages.json[type][arrayIndex]
    }

    public getMessage(key: string): string {
        if (this.client.config.submodules.messages.json[key] === undefined)
            return "Message not set in configuration!"
        const arrayIndex = Math.floor(
            Math.random() * this.client.config.submodules.messages.json[key].length
        )
        return this.client.config.submodules.messages.json[key][arrayIndex]
    }
}
